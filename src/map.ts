/**
 * User-defined comparison function to compare {@link OrderedMap} keys.
 *
 * It must return:
 *
 * - a negative number if `lhs` < `rhs`,
 * - zero if `lhs` == `rhs`,
 * - a positive number if `lhs` > `rhs`,
 *
 * for user-defined meanings of <, ==, and >.
 */
export type CompareFn<Key> = (lhs: Key, rhs: Key) => number;

class Node<Key, Value> {
  public left: Node<Key, Value> | null = null;
  public right: Node<Key, Value> | null = null;

  public constructor(public readonly key: Key, public value: Value) {}

  public *[Symbol.iterator](): Generator<[Key, Value]> {
    if (this.left) {
      yield* this.left;
    }
    yield [this.key, this.value];
    if (this.right) {
      yield* this.right;
    }
  }

  public delete(compare: CompareFn<Key>, key: Key): [boolean, MaybeNode<Key, Value>] {
    const cmp = compare(key, this.key);
    if (cmp < 0) {
      if (this.left) {
        const [deleted, left] = this.left.delete(compare, key);
        this.left = left;
        return [deleted, this];
      } else {
        return [false, this];
      }
    } else if (cmp > 0) {
      if (this.right) {
        const [deleted, right] = this.right.delete(compare, key);
        this.right = right;
        return [deleted, this];
      } else {
        return [false, this];
      }
    } else {
      return [true, null];
    }
  }

  public *keys(): Generator<Key> {
    if (this.left) {
      yield* this.left.keys();
    }
    yield this.key;
    if (this.right) {
      yield* this.right.keys();
    }
  }

  public set(compare: CompareFn<Key>, key: Key, value: Value): Node<Key, Value> {
    const cmp = compare(key, this.key);
    if (cmp < 0) {
      if (this.left) {
        this.left = this.left.set(compare, key, value);
      } else {
        this.left = new Node<Key, Value>(key, value);
      }
      return this;
    } else if (cmp > 0) {
      if (this.right) {
        this.right = this.right.set(compare, key, value);
      } else {
        this.right = new Node<Key, Value>(key, value);
      }
      return this;
    } else {
      this.value = value;
      return this;
    }
  }

  public *values(): Generator<Value> {
    if (this.left) {
      yield* this.left.values();
    }
    yield this.value;
    if (this.right) {
      yield* this.right.values();
    }
  }
}

type MaybeNode<Key, Value> = Node<Key, Value> | null;

/**
 * Almost drop-in
 * [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
 * replacement with deterministic iteration order.
 *
 * Implemented as a self-balancing binary search tree.
 *
 * The only API difference is in the constructor: the first argument of the `OrderedMap()`
 * constructor must be the user-defined comparison function that this class uses to determine the
 * order of the keys.
 *
 * The comparison function must be pure and return results that are consistent with a total order
 * relationship, otherwise the behavior of `OrderedMap` is undefined.
 */
export class OrderedMap<Key, Value> {
  private readonly _compare: CompareFn<Key>;
  private _root: MaybeNode<Key, Value> = null;
  private _size = 0;

  /**
   * Constructs an `OrderedMap`.
   *
   * @param cmp A user-defined {@link CompareFn | comparison function}.
   * @param elements An optional set of elements to insert upon construction.
   */
  public constructor(cmp: CompareFn<Key>, elements?: Iterable<[Key, Value]>) {
    this._compare = cmp;
    if (elements) {
      for (const [key, value] of elements) {
        this.set(key, value);
      }
    }
  }

  /**
   * Returns the number of elements in the map.
   *
   * Complexity: `O(1)`.
   */
  public get size(): number {
    return this._size;
  }

  /**
   * Iterates over the map entries in the order defined by the comparison function.
   */
  public *[Symbol.iterator](): Generator<[Key, Value]> {
    if (this._root) {
      yield* this._root;
    }
  }

  /**
   * Removes all elements from the map.
   *
   * Complexity: `O(1)`.
   */
  public clear(): void {
    this._root = null;
    this._size = 0;
  }

  /**
   * Removes the element with the specified key from the map.
   *
   * Doesn't do anything if the map doesn't have an element with that key.
   *
   * Complexity: `O(log(N))` comparisons.
   *
   * @param key The key of the element to remove.
   * @returns `true` if the element was found and deleted, `false`, otherwise.
   */
  public delete(key: Key): boolean {
    if (this._root) {
      const [deleted, newRoot] = this._root.delete(this._compare, key);
      this._root = newRoot;
      return deleted;
    } else {
      return false;
    }
  }

  /**
   * Iterates over the map entries in the order defined by the comparison function.
   */
  public *entries(): Generator<[Key, Value]> {
    if (this._root) {
      yield* this._root;
    }
  }

  /**
   * Iterates over the map entries in the order defined by the comparison function, and invokes the
   * user-provided callback on each entry.
   *
   * The user-defined callback has three arguments: the `value` of the current entry, the `key`, and
   * a reference to the map itself.
   *
   * Example:
   *
   * ```js
   * map.forEach((value, key, map) => {
   *   console.log(`${key}: ${value}`);
   * });
   * ```
   *
   * @param callback A user-defined function.
   * @param scope An optional object to use as the `this` argument for callback invocations.
   */
  public forEach(
    callback: (value: Value, key: Key, map: OrderedMap<Key, Value>) => void,
    scope?: object
  ): void {
    for (const [key, value] of this) {
      callback.call(scope, value, key, this);
    }
  }

  /**
   * Retrieves the value associated with the specified key, if any.
   *
   * Complexity: `O(log(N))` comparisons.
   *
   * @param key The key of the element to retrieve.
   * @returns The value of the element, or `undefined` there's no such element.
   */
  public get(key: Key): Value | undefined {
    let node = this._root;
    while (node) {
      const cmp = this._compare(key, node.key);
      if (cmp < 0) {
        node = node.left;
      } else if (cmp > 0) {
        node = node.right;
      } else {
        return node.value;
      }
    }
    return void 0;
  }

  /**
   * Looks up the specified key in the map and returns a boolean indicating whether it was found.
   *
   * Complexity: `O(log(N))` comparisons.
   *
   * @param key The key to look up.
   * @returns `true` if the key was found, `false` otherwise.
   */
  public has(key: Key): boolean {
    let node = this._root;
    while (node) {
      const cmp = this._compare(key, node.key);
      if (cmp < 0) {
        node = node.left;
      } else if (cmp > 0) {
        node = node.right;
      } else {
        return true;
      }
    }
    return false;
  }

  /**
   * Iterates over the keys in the map in the order defined by the comparison function.
   */
  public *keys(): Generator<Key> {
    if (this._root) {
      yield* this._root.keys();
    }
  }

  /**
   * Inserts or updates an entry in the map.
   *
   * Complexity: `O(log(N))` comparisons.
   *
   * @param key The key to insert or update.
   * @param value The value.
   * @returns A reference to the map itself.
   */
  public set(key: Key, value: Value): OrderedMap<Key, Value> {
    if (this._root) {
      this._root = this._root.set(this._compare, key, value);
    } else {
      this._root = new Node<Key, Value>(key, value);
    }
    return this;
  }

  /**
   * Iterates over the values in the map respecting the order of their keys as defined by the
   * comparison function.
   */
  public *values(): Generator<Value> {
    if (this._root) {
      yield* this._root.values();
    }
  }
}
