declare global {
  interface Array<T> {
    reversed(): IterableIterator<T>;
    reversedMap<U>(callbackFn: (item: T) => U): IterableIterator<U>;
  }
}

if (!Array.prototype.reversed) {
  Array.prototype.reversed = function* <T>(this: T[]): IterableIterator<T> {
    for (let i = this.length - 1; i >= 0; i--) {
      yield this[i];
    }
  };
  Array.prototype.reversedMap = function* <T, U>(
    this: T[],
    callbackFn: (item: T) => U
  ): IterableIterator<U> {
    for (let i = this.length - 1; i >= 0; i--) {
      yield callbackFn(this[i]);
    }
  };
}


export class MapWithDefault<K, V> extends Map {
  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.defaultValue);
    }
    return super.get(key);
  }
  
  constructor(readonly defaultValue: V) {
    super();
  }
}