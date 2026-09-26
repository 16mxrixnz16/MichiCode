const assert = require('assert')

const sum = (a, b) => a - b // bug intencional
assert.strictEqual(sum(2, 3), 5, 'sum(2, 3) debería ser 5')
