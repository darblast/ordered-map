## `@darblast/ordered-map`

[![](https://img.shields.io/npm/v/@darblast/ordered-map)](https://www.npmjs.com/package/@darblast/ordered-map)
[![License: MIT](https://img.shields.io/github/license/darblast/ordered-map)](https://github.com/darblast/ordered-map/blob/master/LICENSE)
[![Node.js CI](https://github.com/darblast/ordered-map/actions/workflows/node.js.yml/badge.svg)](https://github.com/darblast/ordered-map/actions/workflows/node.js.yml)

Almost drop-in
[Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
replacement with deterministic iteration order. The underlying implementation uses a self-balancing
binary search tree whose order relationship is defined by a user-provided function.
