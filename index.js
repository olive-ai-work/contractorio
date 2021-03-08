const path = require('path')
const {
  amend,
  map,
  range,
  omit,
  withDefaults
} = require('kyanite')
const fs = require('fs-extra')
const alea = require('./_internal/alea')
const defaultTables = require('./defaults.json')
const { _curry2, _curry3, _curry4 } = require('./_internal/_curry')
const {
  minRandoNumber,
  probability,
  randoAddress,
  randoDate,
  randoLetter,
  randoName,
  randoNumber,
  randomPipe,
  getRandomItem
} = require('./_internal/random')

const getCodeAndDesc = _curry2(function getCodeAndDesc (data, seed) {
  const [[code, desc], nextSeed] = getRandomItem(data, alea(seed).quick())

  return [{
    value: code,
    description: desc
  }, nextSeed]
})

// Uses probability to build out a random length member id
const createID = _curry3(function createID (memberIDLens, noAlpha, seed) {
  const [len, nextSeed] = getRandomItem(memberIDLens, seed)
  let loopSeed = nextSeed
  let ID = ''

  for (let i = 0; i < len; i++) {
    const [char, newSeed] = noAlpha
      ? randoNumber(9, loopSeed)
      : probability([
        [randoNumber(9, loopSeed), 0.80],
        [randoLetter(loopSeed), 0.20]
      ], loopSeed)

    loopSeed = newSeed
    ID += char
  }

  return [ID, loopSeed]
})

function generatePatient (tables, { dateFormat }, seed) {
  const [
    [{ date: dateOfBirth, age }, { firstName, lastName }, gender, memberID, address, accountNumber],
    nextSeed
  ] = randomPipe([
    randoDate(dateFormat, tables),
    randoName(tables),
    getRandomItem(tables.genders),
    createID(tables.memberIDLens, false),
    randoAddress(tables),
    createID([11], false)
  ], seed)

  return [{
    firstName,
    lastName,
    age,
    gender,
    memberID,
    address,
    accountNumber,
    dateOfBirth
  }, nextSeed]
}

const generateSubscriber = _curry4(function generateSubscriber (tables, opts, patient, seed) {
  const [groupNumber, groupSeed] = createID([9], false, seed)

  if (opts.matchPatient) {
    return [amend(
      omit(['memberID', 'accountNumber', 'age'], patient),
      { subscriberID: patient.memberID, groupNumber }
    ), alea(seed).quick()]
  }

  const [newPatient, patientSeed] = generatePatient(tables, opts, groupSeed)

  return [amend(
    omit(['memberID', 'accountNumber', 'age'], newPatient),
    { subscriberID: patient.memberID, groupNumber }), alea(patientSeed).quick()]
})

const generatePlan = _curry2(function generatePlan ({ planIDLens, planNames }, seed) {
  const [[planID, name, relationValue], nextSeed] = randomPipe([
    createID(planIDLens, false),
    getRandomItem(planNames),
    randoNumber(20)
  ], seed)

  return [{
    planID,
    name,
    relationshipToSubscriber: {
      value: relationValue,
      description: ''
    }
  }, nextSeed]
})

const generateProvider = _curry2(function generateProvider (tables, seed) {
  const [[{ firstName, lastName }, type, TIN, NPI, address, phone], nextSeed] = randomPipe([
    randoName(tables),
    getRandomItem(tables.providerTypes),
    createID([9], true),
    createID([10], true),
    randoAddress(tables),
    createID([11], true)
  ], seed)

  return [{
    firstName,
    lastName,
    type,
    TIN,
    NPI,
    MPIN: '',
    contactInformation: {
      contactType: 'IC',
      contactName: '',
      address,
      phone
    }
  }, nextSeed]
})

const generateFacility = _curry2(function generateFacility (tables, seed) {
  const [[name, address, TIN, NPI, placeOfServiceCode], nextSeed] = randomPipe([
    getRandomItem(tables.facilityNames),
    randoAddress(tables),
    createID([9], true),
    createID([10], true),
    getCodeAndDesc(tables.placeOfService)
  ], seed)

  return [{
    name,
    contactInformation: {
      address
    },
    TIN,
    NPI,
    MPIN: '',
    placeOfServiceCode
  }, nextSeed]
})

const createCodes = _curry4(function createCodes (tables, [min, max], isDiag, seed) {
  const [count, countSeed] = minRandoNumber(min, max, seed)
  let currSeed = countSeed

  return [range(0, count).map(() => {
    if (isDiag) {
      const [[letter, id, isPrimary], newSeed] = randomPipe([
        randoLetter,
        createID([4], true),
        getRandomItem([true, false])
      ], currSeed)

      currSeed = newSeed

      return {
        value: `${letter}${id}`,
        description: '',
        isPrimary
      }
    }
    const [value, newSeed] = getRandomItem(tables.procedureCodes, currSeed)

    currSeed = newSeed

    return {
      value,
      quantity: 1,
      quantityType: 'UN'
    }
  }), currSeed]
})

const generateAuthorization = _curry3(function generateAuthorization ({ dateFormat, range }, tables, seed) {
  const [[
    referralID,
    trackingNumber,
    dateOfService,
    procedureCodes,
    diagnosisCodes,
    requestTypeCode,
    serviceTypeCode,
    certificationTypeCode
  ], nextSeed] = randomPipe([
    createID([4], true),
    createID([9], false),
    randoDate(dateFormat, tables),
    createCodes(tables, range, false),
    createCodes(tables, range, true),
    getCodeAndDesc(tables.requestTypeCodes),
    getCodeAndDesc(tables.serviceTypeCodes),
    getCodeAndDesc(tables.certificationTypeCodes)
  ], seed)

  return [{
    referralID,
    trackingNumber,
    dateOfService: dateOfService.date,
    procedureCodes,
    diagnosisCodes,
    requestTypeCode,
    serviceTypeCode,
    certificationTypeCode
  }, nextSeed]
})

function contractorio (userOpts = {}, userProcedural = {}) {
  const config = withDefaults(defaultTables, userProcedural)
  const opts = withDefaults({
    dateFormat: 'Y-M-D',
    count: 1,
    matchPatient: false,
    write: true,
    range: [2, 4],
    seed: alea(Math.random()).int32(),
    output: './output'
  }, userOpts)
  let currSeed = opts.seed
  const dateFn = randoDate(opts.dateFormat, config)
  const today = new Date()
  const results = map(() => {
    const [[admitDate, dischargeDate], nextSeed] = randomPipe([
      dateFn,
      dateFn
    ], alea(currSeed).quick())
    const [patient, patientSeed] = generatePatient(config, opts, nextSeed)
    const [[subscriber, plan, provider, facility, authorization], finalSeed] = randomPipe([
      generateSubscriber(config, opts, patient),
      generatePlan(config),
      generateProvider(config),
      generateFacility(config),
      generateAuthorization(opts, config)
    ], patientSeed)

    currSeed = finalSeed

    return {
      patient,
      subscriber,
      payer: {
        plan
      },
      provider,
      facility,
      encounter: {
        admitDate: admitDate.date,
        dischargeDate: dischargeDate.date
      },
      authorization
    }
  }, range(0, opts.count))

  // Write the output to a json
  if (opts.write) {
    fs.mkdirp(opts.output)
      .then(() => fs.writeJSON(path.join('output', `${today.getTime()}.json`), { seed: opts.seed, results }))
      .catch(console.error)
  }

  return { seed: opts.seed, results }
}

module.exports = contractorio
