import {
  createWriteStream,
} from 'node:fs';
import {
  type FileHandle,

  mkdtempDisposable,
  open,
} from 'node:fs/promises';
import {
  tmpdir,
} from 'node:os';
import {
  basename,
  join,
  resolve,
} from 'node:path';
import {
  cwd,
} from 'node:process';
import type {
  Writable,
} from 'node:stream';
import {
  WritableStream,
} from 'node:stream/web';
import {
  URL,
} from 'node:url';

import type {
  ENUM_LINE_SEPARATOR,
} from '../i18n/index.ts';
import {
  getLangData,
  LINE_SEPARATOR,
} from '../i18n/index.ts';
import {
  type Parsers,
  type ParserStateStreamingConfig,

  DEFAULT_STREAM_PARSER_STATE_CONFIG,
} from '../state/index.ts';

import {
  SegmentParser,
} from './segment-parser.ts';
import {
  StreamParser,
} from './stream-parser.ts';

type PartialParserStateStreamingConfig = Partial<ParserStateStreamingConfig>;

/** Options common to {@link StreamingTextDocumentParser}'s parse-* methods. */
export interface BaseParseConfig extends PartialParserStateStreamingConfig {
  /** Where to write rendered output: a file path, or a writable stream. */
  output?: string | Writable;
}

/** Options for {@link StreamingTextDocumentParser.parseFile}. */
export interface ParseFileConfig extends BaseParseConfig {
  /** Path of the input file to parse. */
  file: string;
}

/** Options for {@link StreamingTextDocumentParser.parseURL} (also accepts `fetch` init). */
export interface ParseURLConfig extends BaseParseConfig, RequestInit {
  /** URL of the document to fetch and parse. */
  url: string;
}

/** Prefix used for the temp directory that downloaded URLs are streamed into. */
export const TEMP_DIRECTORY_PREFIX = `tendril-stream-parser-output-dir-`;

/**
 * A streaming parser for text documents read from a file or URL.
 *
 * A {@link StreamParser} using the standard {@link SegmentParser}, with
 *   convenience entry points that read an input source line by line, feed it
 *   through the streaming pipeline, and optionally pipe the serialized AST to an
 *   output file or stream.
 */
export class StreamingTextDocumentParser extends StreamParser {
  /**
   * Factory for a {@link StreamingTextDocumentParser}.
   *
   * @param lang - Language code used to resolve segmentation rules (e.g. `'en'`).
   * @param originalLineSeparator - The source text's line separator (defaults to `LF`).
   * @returns A new {@link StreamingTextDocumentParser} instance.
   */
  static new(lang: string, originalLineSeparator: ENUM_LINE_SEPARATOR = LINE_SEPARATOR.LF) {
    return new StreamingTextDocumentParser({
      lang: getLangData(lang),
      originalLineSeparator,
    });
  }

  /**
   * Ends the stream, additionally clearing the cached input/output stream handles.
   *
   * @returns A promise resolving to this parser.
   */
  end() {
    const {
      state,
    } = this;

    state.temp(`input_stream`, null);
    state.temp(`output_stream`, null);

    return super.end();
  }

  /**
   * Parses a local file, streaming its lines through the parser.
   *
   * Opens the file (relative to the current working directory), begins a
   *   streaming parse, wires up the optional output target, and consumes the
   *   input to completion.
   *
   * @param config - File path plus optional `output` and streaming-state options.
   * @returns A promise resolving to this parser once the file is fully parsed.
   */
  async parseFile(config: ParseFileConfig) {
    await using file = await open(resolve(cwd(), config.file), `r`);

    await this.begin(config);

    this.state.temp<FileHandle>(`input_stream`, file);

    return await this
      .initOutputStream(config)
      .parseInputStream();
  }

  /**
   * Fetches a document from a URL and parses it.
   *
   * The response body is streamed to a temporary file, which is then parsed via
   *   {@link StreamingTextDocumentParser.parseFile | parseFile}. Any extra config
   *   fields are forwarded to `fetch` as request init.
   *
   * @param config - URL plus optional `output`, streaming-state, and `fetch` options.
   * @returns A promise resolving to this parser.
   * @throws If the URL cannot be fetched (non-OK response).
   */
  async parseURL(config: ParseURLConfig) {
    const {
      onChunk = DEFAULT_STREAM_PARSER_STATE_CONFIG.onChunk,
      output,
      url,
      ...init
    } = config;
    const res = await fetch(url, {
      method: `GET`,
      ...init,
    });
    const uri = new URL(url);

    if (!res.ok) {
      throw new Error(`StreamParser#ParseURLError could not fetch URL: ${url}; status: ${res.status}.`);
    }

    await using temp = await mkdtempDisposable(join(tmpdir(), TEMP_DIRECTORY_PREFIX));

    const fileName = join(temp.path, basename(uri.pathname));
    const file = createWriteStream(fileName, {
      flags: `w+`,
    });
    const stream = new WritableStream({
      close: async () => {
        file.end();

        await this.parseFile({
          file: fileName,
          onChunk,
          output,
        });
      },
      write(chunk) {
        file.write(chunk);
      },
    });

    await res.body?.pipeTo?.(stream);

    return this;
  }

  /**
   * Extends the base parsers with the standard {@link SegmentParser}.
   *
   * @returns The parser registry keyed by level.
   */
  protected getParsers(): Parsers {
    const {
      lang,
    } = this;
    const parsers = super.getParsers();

    return {
      ...parsers,
      segment: SegmentParser.new({
        lang,
      }),
    };
  }

  /**
   * Wires the parser's output stream to the configured target (a file path or a
   *   writable stream), if any.
   *
   * @param config - The parse config carrying the optional `output` target.
   * @returns This parser, for chaining.
   */
  protected initOutputStream(config: BaseParseConfig) {
    const {
      output,
    } = config;

    if (!output) {
      return this;
    }

    const file = typeof output === `string`
      ? createWriteStream(resolve(cwd(), output), {
        encoding: `utf8`,
        flags: `w+`,
      })
      : output;

    if (file) {
      this.state.temp(`output_stream`, file);

      this.stream.pipe(file);
    }

    return this;
  }

  /**
   * Reads the cached input file line by line, feeding each into
   *   {@link StreamParser.parse | parse}, then ends the stream.
   *
   * @returns A promise resolving to this parser once the input is exhausted.
   */
  protected async parseInputStream() {
    const input = this.state.temp<FileHandle>(`input_stream`);

    for await (const line of input.readLines()) {
      await this.parse(line);
    }

    return this.end();
  }
}
