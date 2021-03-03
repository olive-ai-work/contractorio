const path = require('path')
const {
  amend,
  map,
  range,
  omit,
  withDefaults
} = require('kyanite')
const fs = require('fs-extra')
const defaultTables = require('./defaults.json')
const {
  minRandoNumber,
  probability,
  randoAddress,
  randoDate,
  randoLetter,
  randoName,
  randoNumber
} = require('./_internal/random')

function getCodeAndDesc (data) {
  const [code, desc] = data[randoNumber(data.length)]

  return {
    value: code,
    description: desc
  }
}

// Uses probability to build out a random length member id
function createID (memberIDLens, noAlpha) {
  const len = memberIDLens[randoNumber(memberIDLens.length)]

  let ID = ''

  for (let i = 0; i < len; i++) {
    ID += noAlpha
      ? randoNumber(9)
      : probability([
        [randoNumber(9), 0.80],
        [randoLetter(), 0.20]
      ])
  }

  return ID
}

function generatePatient (tables, { dobFormat }) {
  const { date, age } = randoDate(dobFormat, tables)
  const { firstName, lastName } = randoName(tables)

  return {
    firstName,
    lastName,
    age,
    gender: tables.genders[randoNumber(tables.genders.length)],
    memberID: createID(tables.memberIDLens),
    dateOfBirth: date,
    address: randoAddress(tables),
    accountNumber: createID([11])
  }
}

function generateSubscriber (tables, opts, patient) {
  if (opts.matchPatient) {
    return amend(
      omit(['memberID', 'accountNumber', 'age'], patient),
      { subscriberID: patient.memberID, groupNumber: createID([9]) }
    )
  }

  return amend(
    omit(['memberID', 'accountNumber', 'age'], generatePatient(tables, opts)),
    { subscriberID: patient.memberID, groupNumber: createID([9]) })
}

function generatePlan ({ planIDLens, planNames }) {
  return {
    planID: createID(planIDLens),
    name: planNames[randoNumber(planNames.length)],
    relationshipToSubscriber: {
      value: randoNumber(20),
      description: ''
    }
  }
}

function generateProvider (tables) {
  const { firstName, lastName } = randoName(tables)

  return {
    firstName,
    lastName,
    type: tables.providerTypes[randoNumber(tables.providerTypes.length)],
    TIN: createID([9], true),
    NPI: createID([10], true),
    MPIN: '',
    contactInformation: {
      contactType: 'IC',
      contactName: '',
      address: randoAddress(tables),
      phone: createID([11], true)
    }
  }
}

function generateFacility (tables) {
  return {
    name: tables.facilityNames[randoNumber(tables.facilityNames.length)],
    contactInformation: {
      address: randoAddress(tables)
    },
    TIN: createID([9], true),
    NPI: createID([10], true),
    MPIN: '',
    placeOfServiceCode: getCodeAndDesc(tables.placeOfService)
  }
}

function createCodes ([min, max], isDiag) {
  const count = minRandoNumber(min, max)

  return range(0, count).map(() => {
    if (isDiag) {
      return {
        value: `${randoLetter()}${createID([4], true)}`,
        description: '',
        isPrimary: [true, false][randoNumber(2)]
      }
    }

    return {
      value: createID([5], true),
      quantity: 1,
      quantityType: 'UN'
    }
  })
}

function generateAuthorization ({ dateOfServiceFormat, procCodesRange, diagnosisCodesRange }, tables) {
  return {
    referralID: createID([4], true),
    trackingNumber: createID([9]),
    dateOfService: randoDate(dateOfServiceFormat, tables).date,
    procedureCodes: createCodes(procCodesRange, false),
    diagnosisCodes: createCodes(diagnosisCodesRange, true),
    requestTypeCode: getCodeAndDesc(tables.requestTypeCodes),
    serviceTypeCode: getCodeAndDesc(tables.serviceTypeCodes),
    certificationTypeCode: getCodeAndDesc(tables.certificationTypeCodes)
  }
}

function contractorio (userOpts = {}, count = 1, userProcedural = {}) {
  const config = withDefaults(defaultTables, userProcedural)
  const opts = withDefaults({
    dobFormat: 'M/D/Y',
    admitDateFormat: 'M/D/Y',
    dischargeDateFormat: 'M/D/Y',
    dateOfServiceFormat: 'M/D/Y',
    matchPatient: false,
    procCodesRange: [2, 4],
    diagnosisCodesRange: [2, 4],
    output: './output'
  }, userOpts)

  console.time('Generating Procedural ODC')
  const today = new Date()
  const results = map(() => {
    const patient = generatePatient(config, opts)

    return {
      patient,
      subscriber: generateSubscriber(config, opts, patient),
      payer: {
        plan: generatePlan(config)
      },
      provider: generateProvider(config),
      facility: generateFacility(config),
      encounter: {
        admitDate: randoDate(opts.admitDateFormat, config).date,
        dischargeDate: randoDate(opts.dischargeDateFormat, config).date
      },
      authorization: generateAuthorization(opts, config)
    }
  }, range(0, count))

  fs.mkdirp(opts.output)
    .then(() => fs.writeJSON(path.join('output', `${today.getTime()}.json`), results))
    .then(() => console.timeEnd('Generating Procedural ODC'))
    .catch(console.error)
}

module.exports = contractorio
