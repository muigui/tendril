/**
 * Base async-iterable cursor over an ordered list of items.
 *
 * `IteratorContext` maintains a moving `index` into `items` and exposes
 *   positional helpers (`$curr`, `$next`, `$prev`, `isFirst`, `isLast`, …) that
 *   the parser and its sub-contexts rely on. Iterating with `for await (… of …)`
 *   drives the cursor from the first item to the last, invoking the overridable
 *   {@link IteratorContext.onBegin | onBegin}, {@link IteratorContext.beforeNext | beforeNext},
 *   {@link IteratorContext.next | next}, {@link IteratorContext.afterNext | afterNext}
 *   and {@link IteratorContext.onComplete | onComplete} lifecycle hooks.
 *
 * @typeParam ITEM - The type of each item held in `items`.
 * @typeParam NEXT - The value yielded per iteration (defaults to `ITEM`).
 */
export class IteratorContext<ITEM, NEXT = ITEM> {
  /** Zero-based index of the current item; `-1` before iteration begins. */
  public index: number;
  /** The backing list of items this context iterates over. */
  public items: ITEM[];

  /**
   * @param config - Context configuration.
   * @param config.index - Starting cursor position (defaults to `-1`).
   * @param config.items - The list of items to iterate over.
   */
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

  /** The item at the current cursor position, or `null` if out of range. */
  get $curr() {
    return this.items[this.index] ?? null;
  }

  /** The first item, or `null` when empty. */
  get $first() {
    return this.at(0);
  }

  /** The last item, or `null` when empty. */
  get $last() {
    return this.at(-1);
  }

  /** The item after the cursor, or `null` when already at the last item. */
  get $next(): ITEM | null {
    return this.isLast
      ? null
      : this.items[this.index + 1];
  }

  /** The item before the cursor, or `null` when already at the first item. */
  get $prev(): ITEM | null {
    return this.isFirst
      ? null
      : this.items[this.index - 1];
  }

  /** `true` when the cursor is at (or before) the first item. */
  get isFirst() {
    return this.index <= 0;
  }

  /** `true` when the cursor is at (or past) the last item. */
  get isLast() {
    return this.index >= this.items.length - 1;
  }

  /** The number of items in this context. */
  get size() {
    return this.items.length;
  }

  /**
   * Returns the item at an absolute `offset` (negative counts from the end).
   *
   * @param offset - Index into `items`; negative values count from the end.
   * @returns The item at `offset`, or `null` if out of range.
   */
  at(offset = 0): ITEM | null {
    return this.items.at(offset) ?? null;
  }

  /**
   * Produces the value yielded for the current iteration.
   *
   * The base implementation returns the current item; subclasses override this
   *   to yield a richer per-item sub-context.
   *
   * @returns A promise resolving to the value to yield.
   */
  async next(): Promise<NEXT> {
    return this.items[this.index] as unknown as NEXT;
  }

  /** Lifecycle hook run after each yielded item; no-op by default. */
  protected async afterNext() { }

  /** Lifecycle hook run before each item is yielded; no-op by default. */
  protected async beforeNext() { }

  /** Lifecycle hook run once before iteration begins; no-op by default. */
  protected async onBegin() { }

  /** Lifecycle hook run once after iteration completes; resets the cursor. */
  protected async onComplete() {
    this.index = -1;
  }

  /**
   * Drives the cursor from the first item to the last, yielding each in order.
   *
   * Resets `index`, runs {@link IteratorContext.onBegin | onBegin}, then for each
   *   item runs {@link IteratorContext.beforeNext | beforeNext}, yields
   *   {@link IteratorContext.next | next}, and runs
   *   {@link IteratorContext.afterNext | afterNext}; finally runs
   *   {@link IteratorContext.onComplete | onComplete}.
   */
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
