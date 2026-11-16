import {
  type FileHandle,

  appendFile,
  writeFile,
} from 'node:fs/promises';
import {
  debuglog,
} from 'node:util';

import {
  type Language,

  getLangData,
} from '../i18n/index.ts';
import {
  NodeArray,
} from '../node/index.ts';

const debug = debuglog(`tendril:utils:node-cursor`);

export interface NodeCursorConfig {
  file: string;
  lang: Language | string;
  stream: FileHandle;
}

export class NodeCursor {
  ast: NodeArray;
  file: string;
  lang: Language;
  stream: FileHandle;

  static new(config: NodeCursorConfig) {
    return new NodeCursor(config);
  }

  constructor(config: NodeCursorConfig) {
    const {
      file,
      lang,
      stream,
    } = config;

    this.ast = new NodeArray();

    this.file = file;
    this.lang = typeof lang === `string`
      ? getLangData(lang)
      : lang;
    this.stream = stream;
  }
}
