var isValidSemver = require('semver/functions/valid')
var cleanSemver = require('semver/functions/clean')

module.exports = function (fixer) {
  return {
    fixVersionField: function (data, strict) {
      var loose = !strict
      if (!data.version) {
        data.version = ''
        return true
      }
      if (!isValidSemver(data.version, loose)) {
        throw new Error('Invalid version: "' + data.version + '"')
      }
      data.version = cleanSemver(data.version, loose)
      return true
    },
  }
}
