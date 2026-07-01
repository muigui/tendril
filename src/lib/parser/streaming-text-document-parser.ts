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

export interface BaseParseConfig extends PartialParserStateStreamingConfig {
  output?: string | Writable;
}

export interface ParseFileConfig extends BaseParseConfig {
  file: string;
}

export interface ParseURLConfig extends BaseParseConfig, RequestInit {
  url: string;
}

export const TEMP_DIRECTORY_PREFIX = `tendril-stream-parser-output-dir-`;

export class StreamingTextDocumentParser extends StreamParser {
  static new(lang: string, originalLineSeparator: ENUM_LINE_SEPARATOR = LINE_SEPARATOR.LF) {
    return new StreamingTextDocumentParser({
      lang: getLangData(lang),
      originalLineSeparator,
    });
  }

  end() {
    const {
      state,
    } = this;

    state.temp(`input_stream`, null);
    state.temp(`output_stream`, null);

    return super.end();
  }

  async parseFile(config: ParseFileConfig) {
    await using file = await open(resolve(cwd(), config.file), `r`);

    await this.begin(config);

    this.state.temp<FileHandle>(`input_stream`, file);

    return await this
      .initOutputStream(config)
      .parseInputStream();
  }

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

  protected async parseInputStream() {
    const input = this.state.temp<FileHandle>(`input_stream`);

    for await (const line of input.readLines()) {
      await this.parse(line);
    }

    return this.end();
  }

  // get [Symbol.toStringTag]() {
  //   return `TendrilParser(StreamingTextDocument)`;
  // }
}
