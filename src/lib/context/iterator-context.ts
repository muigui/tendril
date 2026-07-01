export class IteratorContext<ITEM, NEXT = ITEM> {
  public index: number;
  public items: ITEM[];

  constructor({
    index = -1,
    items,
  }: {
    index?: number;
    items: ITEM[];
  }) {
    this.items = items;
    this.index = index;
  }

  get $curr() {
    return this.items[this.index] ?? null;
  }

  get $first() {
    return this.at(0);
  }

  get $last() {
    return this.at(-1);
  }

  get $next(): ITEM | null {
    return this.isLast
      ? null
      : this.items[this.index + 1];
  }

  get $prev(): ITEM | null {
    return this.isFirst
      ? null
      : this.items[this.index - 1];
  }

  get isFirst() {
    return this.index <= 0;
  }

  get isLast() {
    return this.index >= this.items.length - 1;
  }

  get size() {
    return this.items.length;
  }

  at(offset = 0): ITEM | null {
    return this.items.at(offset) ?? null;
  }

  async next(): Promise<NEXT> {
    return this.items[this.index] as unknown as NEXT;
  }

  protected async afterNext() { }

  protected async beforeNext() { }

  protected async onBegin() { }

  protected async onComplete() {
    this.index = -1;
  }

  async* [Symbol.asyncIterator]() {
    const len = this.items.length;

    this.index = -1;

    await this.onBegin();

    while (++this.index < len) {
      await this.beforeNext();

      yield await this.next();

      await this.afterNext();
    }

    await this.onComplete();
  }

  // * [Symbol.iterator]() {
  //   const len = this.items.length;
  //
  //   this.index = -1;
  //
  //   this.onBegin();
  //
  //   while (++this.index < len) {
  //     this.beforeNext();
  //
  //     yield this.next();
  //
  //     this.afterNext();
  //   }
  //
  //   this.onComplete();
  // }

  get [Symbol.toStringTag]() {
    return `TendrilContext`;
  }
}
