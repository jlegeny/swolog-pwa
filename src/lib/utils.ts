declare global {
  interface Array<T> {
    reversed(): IterableIterator<T>;
  }
}

if (!Array.prototype.reversed) {
  Array.prototype.reversed = function* <T>(this: T[]): IterableIterator<T> {
    for (let i = this.length - 1; i >= 0; i--) {
      yield this[i];
    }
  };
}
