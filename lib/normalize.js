module.exports = normalize

var fixer = require('./fixer')
normalize.fixer = fixer

var makeWarning = require('./make_warning')

var thingsToFix = [
  'fixNameField',
  'fixVersionField',
  'fixDescriptionField',
  'fixRepositoryField',
  'fixModulesField',
  'fixScriptsField',
  'fixFilesField',
  'fixBinField',
  'fixManField',
  'fixBugsField',
  'fixKeywordsField',
  'fixReadmeField',
  'fixHomepageField',
  'fixLicenseField',
  'fixDependencies',
  'fixPeople',
  'fixTypos'
]

function normalize (data, warn, strict) {
  if (warn === true) {
    warn = null
    strict = true
  }
  if (!strict) {
    strict = false
  }
  if (!warn || data.private) {
    warn = function () { /* noop */ }
  }

  if (data.scripts &&
      data.scripts.install === 'node-gyp rebuild' &&
      !data.scripts.preinstall) {
    data.gypfile = true
  }
  fixer.warn = function () {
    warn(makeWarning.apply(null, arguments))
  }
  thingsToFix.forEach(function (thingName) {
    fixer[thingName](data, strict)
  })
  data._id = data.name + '@' + data.version
}
