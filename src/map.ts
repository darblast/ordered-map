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
  public leftChild: Node<Key, Value> | null = null;
  public rightChild: Node<Key, Value> | null = null;
  public balance = 0;

  public constructor(public readonly key: Key, public value: Value) {}
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

  private _updated = false;

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

  private _rotateLeft(parent: Node<Key, Value>, node: Node<Key, Value>): Node<Key, Value> {
    parent.rightChild = node.leftChild;
    node.leftChild = parent;
    if (node.balance) {
      node.balance = 0;
      parent.balance = 0;
    } else {
      node.balance = -1;
      parent.balance = 1;
    }
    return node;
  }

  private _rotateRight(parent: Node<Key, Value>, node: Node<Key, Value>): Node<Key, Value> {
    parent.leftChild = node.rightChild;
    node.rightChild = parent;
    if (node.balance) {
      node.balance = 0;
      parent.balance = 0;
    } else {
      node.balance = 1;
      parent.balance = -1;
    }
    return node;
  }

  private _rotateRightLeft(parent: Node<Key, Value>, node: Node<Key, Value>): Node<Key, Value> {
    const child = node.leftChild!;
    node.leftChild = child.rightChild;
    parent.rightChild = child.leftChild;
    child.leftChild = parent;
    child.rightChild = node;
    if (child.balance > 0) {
      parent.balance = -1;
      node.balance = 0;
    } else if (child.balance < 0) {
      parent.balance = 0;
      node.balance = 1;
    } else {
      parent.balance = 0;
      node.balance = 0;
    }
    child.balance = 0;
    return child;
  }

  private _rotateLeftRight(parent: Node<Key, Value>, node: Node<Key, Value>): Node<Key, Value> {
    const child = node.rightChild!;
    node.rightChild = child.leftChild;
    parent.leftChild = child.rightChild;
    child.rightChild = parent;
    child.leftChild = node;
    if (child.balance > 0) {
      parent.balance = 0;
      node.balance = -1;
    } else if (child.balance < 0) {
      parent.balance = 1;
      node.balance = 0;
    } else {
      parent.balance = 0;
      node.balance = 0;
    }
    child.balance = 0;
    return child;
  }

  /**
   * Returns the number of elements in the map.
   *
   * Complexity: `O(1)`.
   */
  public get size(): number {
    return this._size;
  }

  private *_entries(node: MaybeNode<Key, Value>): Generator<[Key, Value]> {
    if (node) {
      yield* this._entries(node.leftChild);
      yield [node.key, node.value];
      yield* this._entries(node.rightChild);
    }
  }

  /**
   * Iterates over the map entries in the order defined by the comparison function.
   */
  public *[Symbol.iterator](): Generator<[Key, Value]> {
    yield* this._entries(this._root);
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

  private _delete(node: MaybeNode<Key, Value>, key: Key): MaybeNode<Key, Value> {
    if (node) {
      const cmp = this._compare(key, node.key);
      if (cmp < 0) {
        node.leftChild = this._delete(node.leftChild, key);
        return node;
      } else if (cmp > 0) {
        node.rightChild = this._delete(node.rightChild, key);
        return node;
      } else {
        this._size--;
        this._updated = true;
        return null;
      }
    } else {
      return null;
    }
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
    this._updated = false;
    this._root = this._delete(this._root, key);
    return this._updated;
  }

  /**
   * Iterates over the map entries in the order defined by the comparison function.
   */
  public *entries(): Generator<[Key, Value]> {
    yield* this._entries(this._root);
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
        node = node.leftChild;
      } else if (cmp > 0) {
        node = node.rightChild;
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
        node = node.leftChild;
      } else if (cmp > 0) {
        node = node.rightChild;
      } else {
        return true;
      }
    }
    return false;
  }

  private *_keys(node: MaybeNode<Key, Value>): Generator<Key> {
    if (node) {
      yield* this._keys(node.leftChild);
      yield node.key;
      yield* this._keys(node.rightChild);
    }
  }

  /**
   * Iterates over the keys in the map in the order defined by the comparison function.
   */
  public *keys(): Generator<Key> {
    yield* this._keys(this._root);
  }

  private _setLeft(node: Node<Key, Value>, key: Key, value: Value): Node<Key, Value> {
    const child = this._set(node.leftChild, key, value);
    node.leftChild = child;
    if (!this._updated) {
      return node;
    }
    if (node.balance < 0) {
      if (child.balance > 0) {
        return this._rotateLeftRight(node, child);
      } else {
        return this._rotateRight(node, child);
      }
    } else {
      node.balance--;
      return node;
    }
  }

  private _setRight(node: Node<Key, Value>, key: Key, value: Value): Node<Key, Value> {
    const child = this._set(node.rightChild, key, value);
    node.rightChild = child;
    if (!this._updated) {
      return node;
    }
    if (node.balance > 0) {
      if (child.balance < 0) {
        return this._rotateRightLeft(node, child);
      } else {
        return this._rotateLeft(node, child);
      }
    } else {
      node.balance++;
      return node;
    }
  }

  private _set(node: MaybeNode<Key, Value>, key: Key, value: Value): Node<Key, Value> {
    if (node) {
      const cmp = this._compare(key, node.key);
      if (cmp < 0) {
        return this._setLeft(node, key, value);
      } else if (cmp > 0) {
        return this._setRight(node, key, value);
      } else {
        node.value = value;
        return node;
      }
    } else {
      this._size++;
      this._updated = true;
      return new Node<Key, Value>(key, value);
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
    this._updated = false;
    this._root = this._set(this._root, key, value);
    return this;
  }

  public *_values(node: MaybeNode<Key, Value>): Generator<Value> {
    if (node) {
      yield* this._values(node.leftChild);
      yield node.value;
      yield* this._values(node.rightChild);
    }
  }

  /**
   * Iterates over the values in the map respecting the order of their keys as defined by the
   * comparison function.
   */
  public *values(): Generator<Value> {
    yield* this._values(this._root);
  }
}
