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
    expect([...map.entries()]).to.eql([]);
    expect([...map.keys()]).to.eql([]);
    expect([...map.values()]).to.eql([]);
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

  // TODO
});
