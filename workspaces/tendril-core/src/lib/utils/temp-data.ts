import type {
  TempStateData,
  TempStateDataValue,
} from './types.ts';

export class TempData {
  #temp!: TempStateData;

  static new() {
    return new TempData();
  }

  constructor() {
    this.#temp = {};
  }

  clear() {
    Object.keys(this.#temp)
      .forEach(key => this.del(key));

    return this;
  }

  del(key: string) {
    delete this.#temp[key];

    return this;
  }

  get<T = TempStateDataValue>(key: string): null | T {
    return this.#temp[key] ?? null;
  }

  set<T = TempStateDataValue>(key: string, value: T) {
    this.#temp[key] = value as T;

    return this;
  }
}
