const { pipe, replace } = require('kyanite')
const { _curry2, _curry3 } = require('./_curry')
const alea = require('./alea')

function randoNumber (max, seed) {
  const nextSeed = alea(seed).quick()

  return [Math.floor(nextSeed * max), nextSeed]
}

function minRandoNumber (min, max, seed) {
  const nextSeed = alea(seed).quick()

  return [Math.floor(nextSeed * (max - min + 1)) + min, nextSeed]
}

const getRandomItem = _curry2(function getRandomItem (items, seed) {
  const [i, nextSeed] = randoNumber(items.length, seed)

  return [
    items[i],
    nextSeed
  ]
})

function randomPipe (fns, seed) {
  return fns.reduce(([acc, currSeed], f) => {
    const [d, fSeed] = f(currSeed)

    acc.push(d)

    return [acc, fSeed]
  }, [[], seed])
}

function randoLetter (seed) {
  const nextSeed = alea(seed).quick()
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

  return getRandomItem(letters, nextSeed)
}

function probability (list) {
  let num = Math.random()

  for (const [item, prob] of list) {
    num = num - prob

    if (num < 0) {
      return item
    }
  }
}

// Super Accurate age calculations!
function calcAge (month, day, year) {
  const today = new Date()
  const birthday = new Date(`${month}/${day}/${today.getFullYear()}`)
  let age = today.getFullYear() - year

  if (birthday < today) {
    age += 1
  }

  return age
}

function randoDate (format, { months, days, years }, seed) {
  const [[month, day, year], nextSeed] = randomPipe([
    getRandomItem(months),
    getRandomItem(days),
    getRandomItem(years)
  ], seed)

  return [{
    date: pipe([
      replace('M', month),
      replace('D', day),
      replace('Y', year)
    ], format),
    age: calcAge(month, day, year)
  }, nextSeed]
}

function randoAddressLine ({ streetNumbers, streetNames }, seed) {
  const [acc, nextSeed] = randomPipe([
    getRandomItem(streetNumbers),
    getRandomItem(streetNames)
  ], seed)

  return [
    `${acc[0]} ${acc[1]}`,
    nextSeed
  ]
}

function randoAddress ({ buildingInfo, streetNames, cityNames, streetNumbers, states, zips }, seed) {
  const [line1, lineSeed] = randoAddressLine({ streetNames, streetNumbers }, seed)
  const [[line2, zip, state, city], nextSeed] = randomPipe([
    getRandomItem(buildingInfo),
    getRandomItem(zips),
    getRandomItem(states),
    getRandomItem(cityNames)
  ], lineSeed)

  return [{
    line1,
    line2,
    zip,
    state,
    city
  }, nextSeed]
}

function randoName (tables, seed) {
  const [[firstName, lastName], nextSeed] = randomPipe([
    getRandomItem(tables.firstNames),
    getRandomItem(tables.lastNames)
  ], seed)

  return [{
    firstName,
    lastName
  }, nextSeed]
}

module.exports = {
  minRandoNumber,
  probability,
  randoAddress: _curry2(randoAddress),
  randoDate: _curry3(randoDate),
  randoLetter,
  randoName: _curry2(randoName),
  randoNumber: _curry2(randoNumber),
  randomPipe,
  getRandomItem
}
