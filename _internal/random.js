const { pipe, replace } = require('kyanite')

function randoNumber (max) {
  return Math.floor(Math.random() * max)
}

function minRandoNumber (min, max) {
  return min + Math.random() * (max - min)
}

function randoLetter () {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

  return letters[randoNumber(letters.length)]
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

function randoDate (format, { months, days, years }) {
  const [month, day, year] = [
    months[randoNumber(months.length)],
    days[randoNumber(days.length)],
    years[randoNumber(years.length)]
  ]

  return {
    date: pipe([
      replace('M', month),
      replace('D', day),
      replace('Y', year)
    ], format),
    age: calcAge(month, day, year)
  }
}

function randoAddress ({ buildingInfo, streetNames, cityNames, streetNumbers, states, zips }) {
  return {
    line1: `${streetNumbers[randoNumber(streetNumbers.length)]} ${streetNames[randoNumber(streetNames.length)]}`,
    line2: buildingInfo[randoNumber(buildingInfo.length)],
    zip: zips[randoNumber(zips.length)],
    state: states[randoNumber(states.length)],
    city: cityNames[randoNumber(cityNames.length)]
  }
}

function randoName ({ firstNames, lastNames }) {
  return {
    firstName: firstNames[randoNumber(firstNames.length)],
    lastName: lastNames[randoNumber(lastNames.length)]
  }
}

module.exports = {
  minRandoNumber,
  probability,
  randoAddress,
  randoDate,
  randoLetter,
  randoName
}
