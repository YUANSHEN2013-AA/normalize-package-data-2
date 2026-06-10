var isValidSemver = require('semver/functions/valid')
var cleanSemver = require('semver/functions/clean')

module.exports = function (data, strict) {
  // allow "loose" semver 1.0 versions in non-strict mode
  // enforce strict semver 2.0 compliance in strict mode
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
}
