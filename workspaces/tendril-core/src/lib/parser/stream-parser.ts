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
  nextTick,
} from 'node:process';
import {
  type Writable,

  PassThrough,
} from 'node:stream';
import {
  WritableStream,
} from 'node:stream/web';
import {
  URL,
} from 'node:url';
import {
  debuglog,
} from 'node:util';

import type {
  RawTextValue,
} from '../../types.ts';

import {
  ASTContext,
} from '../context/index.ts';
import {
  getLangData,
} from '../i18n/index.ts';
import {
  DocumentNode,
  ReferenceManager,
} from '../node/index.ts';
import {
  aggregateTokens,
  resolveCategories,
  Segmenter,
} from '../utils/index.ts';

import {
  ContextParser,
  type ContextParserConfig,
} from './context-parser.ts';
import {
  SegmentParser,
} from './segment-parser.ts';
import {
  type AggregationConfig,
  type BaseParseConfig,
  type ENUM_SENTENCE_SEGMENT_STYLE,
  type ParseFileConfig,
  type ParserStateStreamingConfig,
  type ParseURLConfig,
  type PartialParserStateStreamingConfig,

  DEFAULT_STREAM_PARSER_STATE_CONFIG,
  TEMP_DIRECTORY_PREFIX,
} from './types.ts';

const debug = debuglog(`tendril:parser:stream`);

export interface StreamParserConfig extends ContextParserConfig<ASTContext> {
  aggregate?: AggregationConfig;
  handleMismatchedQuotes?: boolean;
  sentenceSegmentStyle?: ENUM_SENTENCE_SEGMENT_STYLE;
}

export interface StreamParserNewConfig extends Omit<StreamParserConfig, `lang`> {
  lang: string;
}

// @ts-ignore Ignore TS2515. We've only just started!
export class StreamParser extends ContextParser<ASTContext> {
  segmenter!: Segmenter;

  #aggregate: AggregationConfig;
  #currentIndex!: number;
  #finalizing: boolean;
  #handleMismatchedQuotes: boolean;
  #paused: boolean;
  #stream: null | PassThrough = null;

  static new(config: StreamParserNewConfig) {
    const {
      lang,
      ...conf
    } = config;

    return new StreamParser({
      ...conf,
      lang: getLangData(lang),
    });
  }

  constructor(config: StreamParserConfig) {
    super(config);

    this.#aggregate = config.aggregate ?? true;
    this.#currentIndex = 0;
    this.#finalizing = false;
    this.#handleMismatchedQuotes = config.handleMismatchedQuotes ?? false;
    this.#paused = false;

    this.init();
  }

  get aggregate() {
    return this.#aggregate;
  }

  get currentIndex() {
    return this.#currentIndex;
  }

  get finalizing() {
    return this.#finalizing;
  }

  get handleMismatchedQuotes() {
    return this.#handleMismatchedQuotes;
  }

  get on() {
    return !this.paused
      && this.stream
      && this.temp.get(`config`) !== null;
  }

  get paused() {
    return this.#paused;
  }

  get stream() {
    return this.#stream;
  }

  async begin(config?: PartialParserStateStreamingConfig) {
    if (this.on) {
      throw new Error(`${this.constructor.name}AlreadyOnError: The parser and state are already "on" and ready to parse stream chunks.`);
    }

    this.reset();

    config ??= {};

    if (!config?.onChunk) {
      config.onChunk = DEFAULT_STREAM_PARSER_STATE_CONFIG.onChunk;
    }

    const document = DocumentNode.new({
      action: `new`,
      dir: this.lang.dir,
      index: 0,
      lang: this.lang.id,
    });
    const stream = new PassThrough();

    stream.write(document.serialize(this.originalLineSeparator), `utf8`);

    this.#currentIndex = 1;

    this.temp.set<ParserStateStreamingConfig>(`config`, config as ParserStateStreamingConfig);
    this.temp.set<DocumentNode>(`document`, document);
    this.temp.set<PassThrough>(`stream`, this.#stream = stream);
    this.temp.set<string>(`text`, ``);

    return this.resume();
  }

  async end() {
    const {
      originalLineSeparator,
    } = this;

    this.temp
      .del(`input_stream`)
      .del(`output_stream`);

    this.#finalizing = true;

    this.finalize();

    // await this.parse(originalLineSeparator);
    await this.parse(``);

    nextTick(() => {
      // @ts-ignore Ignore TS2339: We know that not all items have a `category`.
      //                           That's a HUGE part of the reason we're checking for it,
      //                             and its value, if it's there, in this `if` statement!
      // if (this.ctx.ast.last?.category === `line`) {
      //   this.ctx.ast.pop();
      // }

      this.flush(this.ctx);

      const document = this.temp.get<DocumentNode>(`document`)!;
      const stream = this.stream!;

      this.temp.del(`document`);

      document.index = this.currentIndex;

      stream.write(document.end().serialize(originalLineSeparator), `utf8`);
      stream.end();

      this.pause();
    });

    return this;
  }

  flush(ctx?: ASTContext) {
    const {
      originalLineSeparator,
    } = this;
    const stream = this.stream!;
    const config = this.temp.get<ParserStateStreamingConfig>(`config`)!;

    ctx ??= this.temp.get<ASTContext>(`ctx`) as ASTContext;

    const {
      ast,
    } = ctx;
    const categories = resolveCategories(this.aggregate);

    if (categories.length) {
      aggregateTokens(ctx.ast, {
        categories,
        ctx,
      });
    }

    ast.reindex(this.currentIndex);

    for (const node of ast) {
      stream.write(node.serialize(originalLineSeparator), `utf8`);
    }

    this.#currentIndex += ast.size;

    config.onChunk(null, ast.toArray());

    ast.clear();

    return this;
  }

  isLoadableChunk(chunk: string) {
    const {
      finalizing,
      lang: {
        isWhiteSpaceOnly,
        paragraphJoin,
      },
      originalLineSeparator,
      paused,
    } = this;
    const fakeCTX = {
      originalLineSeparator,
    } as unknown as ASTContext;

    if (paused) {
      return false;
    }

    if (finalizing) {
      return true;
    }

    const isLoadable = chunk.endsWith(paragraphJoin)
      && !isWhiteSpaceOnly(chunk, fakeCTX);

    if (isLoadable && debug.enabled) {
      const config = this.temp.get<ParseFileConfig>(`config`);

      debug(`####### <chunk(${config?.file})> #######\n`, chunk);
    }

    return isLoadable;
  }

  async parse(text: RawTextValue) {
    const {
      lang,
      originalLineSeparator,
      segmenter,
    } = this;

    if (!this.on) {
      throw new Error(`${this.constructor.name}NotOnError: The parser is not currently "on".`);
    }

    let cachedText = this.temp.get<RawTextValue>(`text`) ?? ``;

    cachedText = `${cachedText}${text}${
      `${text}`.endsWith(originalLineSeparator)
        ? ``
        : originalLineSeparator
    }`;

    this.temp.set<RawTextValue>(`text`, cachedText);

    if (this.isLoadableChunk(cachedText)) {
      this.ctx.load(segmenter.segmentText(cachedText));

      this.temp.del(`text`);

      await this.parseContext(this.ctx);

      // In this class, `shouldFlush` simply returns `true`.
      // It can be overwritten in subclasses if they need to flush conditionally.
      if (this.shouldFlush()) {
        this.flush(this.ctx);
      }
    }

    return this;
  }

  async parseFile(config: ParseFileConfig) {
    await using file = await open(resolve(cwd(), config.file), `r`);

    await this.begin(config);

    this.temp.set<FileHandle>(`input_stream`, file);

    return await this
      .initOutputStream(config)
      .parseInputStream();
  }

  async parseURL(config: ParseURLConfig) {
    const {
      onChunk = DEFAULT_STREAM_PARSER_STATE_CONFIG.onChunk,
      output,
      saveOriginalFile,
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
    const originalFile = saveOriginalFile
      ? createWriteStream(saveOriginalFile, {
        flags: `w+`,
      })
      : null;
    const stream = new WritableStream({
      close: async () => {
        file.end();

        if (originalFile) {
          originalFile.end();
        }

        await this.parseFile({
          file: fileName,
          onChunk,
          output,
        });
      },
      write(chunk) {
        file.write(chunk);

        if (originalFile) {
          originalFile.write(chunk);
        }
      },
    });

    await res.body?.pipeTo?.(stream);

    return this;
  }

  pause() {
    this.#paused = true;

    return this;
  }

  reset() {
    ReferenceManager.reset(this.ASTRefMgr);
    ReferenceManager.reset(this.refMgr);

    this.temp.clear();

    this.#currentIndex = 0;

    return this;
  }

  resume() {
    this.#paused = false;

    return this;
  }

  // This method specifically leaves a way for subclasses to
  //   conditionally decide whether to flush.
  shouldFlush() {
    return true;
  }

  protected finalize() {
    return this;
  }

  protected init() {
    super.init();

    this.ASTRefMgr = ReferenceManager.new({
      getCacheID() {
        return `ast`;
      },
      refIDProperty: `ast_id`,
      refIndexProperty: `ast_index`,
    });

    const {
      ASTRefMgr,
      lang,
      originalLineSeparator,
      refMgr,
    } = this;

    this.segmenter = Segmenter.new({
      lang,
      lineSeparator: originalLineSeparator,
    });

    this.ctx = ASTContext.new({
      ASTRefMgr,
      items: [],
      lang: lang.id,
      originalLineSeparator,
      refMgr,
      segmenter: this.segmenter,
    });

    this.temp.set<ASTContext>(`ctx`, this.ctx);
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
      this.temp.set<Writable>(`output_stream`, file);

      this.stream!.pipe(file);
    }

    return this;
  }

  // @ts-ignore Ignore TS2416. Because we are OVERWRITING!!!
  protected async onParse(ctx: ASTContext) {
    const {
      ast,
    } = ctx;
    const {
      lang,
      originalLineSeparator,
    } = this;

    for await (const segmentCtx of ctx) {
      const segmentParser = SegmentParser.new({
        ctx: segmentCtx,
        lang,
        originalLineSeparator,
        parentParser: this,
      });

      await segmentParser.parseContext(segmentCtx);
    }

    return ast;
  }

  protected async parseInputStream() {
    const input = this.temp.get<FileHandle>(`input_stream`)!;

    for await (const line of input.readLines()) {
      await this.parse(line);
    }

    return this.end();
  }
}
