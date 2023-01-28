import { expect } from 'chai';

import { OrderedMap } from '../dist/map.js';

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

  describe('has', function () {
    it('empty', function () {
      expect(map.has(42)).to.equal(false);
    });

    it('one element', function () {
      map.set(42, 53);
      expect(map.has(1)).to.equal(false);
      expect(map.has(2)).to.equal(false);
      expect(map.has(42)).to.equal(true);
      expect(map.has(53)).to.equal(false);
      expect(map.has(64)).to.equal(false);
    });

    it('two elements', function () {
      map.set(42, 43);
      map.set(53, 54);
      expect(map.has(1)).to.equal(false);
      expect(map.has(2)).to.equal(false);
      expect(map.has(42)).to.equal(true);
      expect(map.has(53)).to.equal(true);
      expect(map.has(64)).to.equal(false);
    });
  });

  it('keys', function () {
    map.set(1, 2);
    map.set(3, 4);
    map.set(5, 6);
    map.set(7, 8);
    expect([...map.keys()]).to.eql([1, 3, 5, 7]);
  });

  // TODO
});
