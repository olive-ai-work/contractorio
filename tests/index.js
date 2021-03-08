const test = require('tape')
const contractorio = require('../')

test('Generates data based on provided seed', t => {
  const resultOne = contractorio({ count: 1, write: false, seed: 1 })
  const resultTwo = contractorio({ count: 1, write: false, seed: 1 })

  t.same(resultOne.results, resultTwo.results, 'The two generated patients are the same')
  t.same(resultOne.seed, resultTwo.seed, 'The carried over seeds are the same')
  t.end()
})

test('Generates same data based on provided seed (multi)', t => {
  const resultOne = contractorio({ count: 6, write: false, seed: 1 })
  const resultTwo = contractorio({ count: 6, write: false, seed: 1 })

  t.same(resultOne.results, resultTwo.results, 'The two generated patients are the same')
  t.same(resultOne.seed, resultTwo.seed, 'The carried over seeds are the same')
  t.end()
})
