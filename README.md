# Contractorio

Welcome to contractorio! The procedural patient generator!

This tool is built to give you data, as much as you want!

## Configuration And Options

The procedural generation of patients ships out of the box, its all handled by the `defaults.json` and probability! You're capable of overwriting ANY aspect of these tables.

> Important: If you overwrite a table, it overwrites the WHOLE table, not just adds to it.

Simply pass in your own object/json that has the same name as one of the tables in `defaults.json` and it will be overwritten by your own table! Don't worry, all of the other tables will be kept intact, so they should still work when generating!

Ontop of that Contractorio takes in a set of options to fine tune smaller details (like numbers and date formats) Here's all that it takes:

- `dobFormat` the format you want the date of birth to be in
- `admitDateFormat` the format you want the `admitDate` to be in
- `dischargeDateFormat` the format you want the `dischargeDate` to be in
- `dateOfServiceFormat` the forma you want the `dateOfService` to be in
- `matchPatient` should the `subscriber` match the patient thats been generated? (besides subscriber specific information)
- `procCodesRange` Whats the minimum number and maximum number of procedure codes you want to generate?
- `diagnosisCodesRange` Whats the minimum number and maximum number of diagnosis codes you want to generate?

Here are the defaults:

```js
{
  dobFormat: 'M/D/Y',
  admitDateFormat: 'M/D/Y',
  dischargeDateFormat: 'M/D/Y',
  dateOfServiceFormat: 'M/D/Y',
  matchPatient: false,
  procCodesRange: [2, 4],
  diagnosisCodesRange: [2, 4]
}
```

The nice thing about Contractorio is that is knows how to fill in the blanks for you. So if you only pass in partial options, Contractorio knows how to fill in the rest.

Example: If you only pass in `{ matchPatient: true }` the rest of the options will be populated by the defaults Contractorio usually uses. Neat huh?

## Date Formats

So formatting dates is pretty easy in Contractorio, simply use `M` for month, `D` for day, and `Y` for year. Place them in any order you want, with any symbols you want, and presto!

For example, passing `Y/M/D` for `dobFormat` will cause all the `dateOfBirth` values to be formatted like `1977/04/22` This is true for ALL the date format options.
