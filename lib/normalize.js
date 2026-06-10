module.exports = normalize

var fixer = require('./fixer')
normalize.fixer = fixer

var makeWarning = require('./make_warning')

normalize.addWarningPlugin = makeWarning.addWarningPlugin
normalize.clearWarningPlugins = makeWarning.clearWarningPlugins

var fieldsToFix = ['name', 'version', 'description', 'repository', 'modules', 'scripts',
  'files', 'bin', 'man', 'bugs', 'keywords', 'readme', 'homepage', 'license']
var otherThingsToFix = ['dependencies', 'people', 'typos']

function normalize (data, warn, strict) {
  if (warn === true) {
    warn = null
    strict = true
  }
  if (!strict) {
    strict = false
  }
  var originalWarn = warn

  if (data.scripts &&
      data.scripts.install === 'node-gyp rebuild' &&
      !data.scripts.preinstall) {
    data.gypfile = true
  }

  var allFields = fieldsToFix.concat(otherThingsToFix)
  allFields.forEach(function (fieldName) {
    var methodName = 'fix' + ucFirst(fieldName)
    if (fieldsToFix.indexOf(fieldName) !== -1) {
      methodName += 'Field'
    }
    fixer.warn = function () {
      var args = Array.prototype.slice.call(arguments, 0)
      var warningName = args[0]
      var info = {
        warningName: warningName,
        args: args.slice(1),
        field: fieldName,
        isPrivate: !!data.private,
        strict: !!strict
      }
      makeWarning.processWarning(info, originalWarn)
    }
    fixer[methodName](data, strict)
  })
  data._id = data.name + '@' + data.version
}

function ucFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
