import { expect } from 'chai';

import { OrderedMap } from '../dist/map.js';

import { range, shuffle } from '@darblast/utils';

OrderedMap.prototype._checkHeight = function (node) {
  if (node) {
    if (node.leftChild && node.leftChild.parent !== node) {
      throw new Error('broken left child link');
    }
    if (node.rightChild && node.rightChild.parent !== node) {
      throw new Error('broken right child link');
    }
    const leftHeight = this._checkHeight(node.leftChild);
    const rightHeight = this._checkHeight(node.rightChild);
    const balance = rightHeight - leftHeight;
    if (balance !== node.balance) {
      throw new Error(`wrong balance: ${node.balance} vs ${balance}`);
    }
    if (balance < -1 || balance > 1) {
      throw new Error('out of balance');
    }
    return 1 + Math.max(leftHeight, rightHeight);
  } else {
    return 0;
  }
};

OrderedMap.prototype.checkBalance = function () {
  this._checkHeight(this._root);
};

describe('OrderedMap', function () {
  const cmp = (lhs, rhs) => lhs - rhs;
  let map;

  beforeEach(function () {
    map = new OrderedMap(cmp);
  });

  it('initial state', function () {
    expect(map.size).to.equal(0);
    expect(map.get(42)).to.equal(undefined);
    expect(map.has(42)).to.equal(false);
    expect([...map]).to.eql([]);
    expect([...map.entries()]).to.eql([]);
    expect([...map.keys()]).to.eql([]);
    expect([...map.values()]).to.eql([]);
    map.checkBalance();
  });

  it('one element', function () {
    map.set(12, 23);
    expect(map.size).to.equal(1);
    expect(map.get(12)).to.equal(23);
    expect(map.has(12)).to.equal(true);
    expect([...map]).to.eql([[12, 23]]);
    expect([...map.entries()]).to.eql([[12, 23]]);
    expect([...map.keys()]).to.eql([12]);
    expect([...map.values()]).to.eql([23]);
    map.checkBalance();
  });

  it('for each', function () {
    map.set(42, 43);
    map.set(53, 54);
    map.set(64, 65);
    map.set(75, 76);
    map.set(86, 87);
    const entries = [];
    map.forEach((value, key) => {
      entries.push([key, value]);
    });
    expect(entries).to.eql([
      [42, 43],
      [53, 54],
      [64, 65],
      [75, 76],
      [86, 87],
    ]);
  });

  it('delete from empty', function () {
    expect(map.delete(42)).to.equal(false);
    expect(map.size).to.equal(0);
    expect(map.get(42)).to.equal(undefined);
    expect(map.has(42)).to.equal(false);
    expect([...map]).to.eql([]);
    expect([...map.entries()]).to.eql([]);
    expect([...map.keys()]).to.eql([]);
    expect([...map.values()]).to.eql([]);
    map.checkBalance();
  });

  it('delete one element', function () {
    map.set(123, 42);
    expect(map.delete(123)).to.equal(true);
    expect(map.size).to.equal(0);
    expect(map.get(123)).to.equal(undefined);
    expect(map.has(123)).to.equal(false);
    expect([...map]).to.eql([]);
    expect([...map.entries()]).to.eql([]);
    expect([...map.keys()]).to.eql([]);
    expect([...map.values()]).to.eql([]);
    map.checkBalance();
  });

  it('delete 1st element out of 2', function () {
    map.set(123, 43);
    map.set(124, 42);
    expect(map.delete(123)).to.equal(true);
    expect(map.size).to.equal(1);
    expect(map.get(123)).to.equal(undefined);
    expect(map.has(123)).to.equal(false);
    expect(map.get(124)).to.equal(42);
    expect(map.has(124)).to.equal(true);
    expect([...map]).to.eql([[124, 42]]);
    expect([...map.entries()]).to.eql([[124, 42]]);
    expect([...map.keys()]).to.eql([124]);
    expect([...map.values()]).to.eql([42]);
    map.checkBalance();
  });

  it('delete 2nd element out of 2', function () {
    map.set(123, 43);
    map.set(124, 42);
    expect(map.delete(124)).to.equal(true);
    expect(map.size).to.equal(1);
    expect(map.get(123)).to.equal(43);
    expect(map.has(123)).to.equal(true);
    expect(map.get(124)).to.equal(undefined);
    expect(map.has(124)).to.equal(false);
    expect([...map]).to.eql([[123, 43]]);
    expect([...map.entries()]).to.eql([[123, 43]]);
    expect([...map.keys()]).to.eql([123]);
    expect([...map.values()]).to.eql([43]);
    // map.checkBalance();
  });

  // TODO

  it('random set', function () {
    const count = 1000;
    const keys = range(count);
    shuffle(keys);
    for (const key of keys) {
      map.set(key, count - key);
      map.checkBalance();
    }
    keys.sort((lhs, rhs) => lhs - rhs);
    expect(map.size).to.equal(count);
    expect([...map.keys()]).to.eql(keys);
  });

  // it('random delete', function () {
  //   const count = 1000;
  //   const keys = range(count);
  //   shuffle(keys);
  //   for (const key of keys) {
  //     map.set(key, count - key);
  //   }
  //   map.checkBalance();
  //   shuffle(keys);
  //   for (let i = 0; i < count / 2; i++) {
  //     map.delete(keys.pop());
  //     map.checkBalance();
  //   }
  //   keys.sort((lhs, rhs) => lhs - rhs);
  //   expect(map.size).to.equal(count);
  //   expect([...map.keys()]).to.eql(keys);
  // });
});
