module.exports = normalize

var fixer = require('./fixer')
normalize.fixer = fixer

var makeWarning = require('./make_warning')
normalize.registerPlugin = makeWarning.registerPlugin
normalize.unregisterPlugin = makeWarning.unregisterPlugin
normalize.getPlugins = makeWarning.getPlugins
normalize.clearPlugins = makeWarning.clearPlugins

var fieldsToFix = ['name', 'version', 'description', 'repository', 'modules', 'scripts',
  'files', 'bin', 'man', 'bugs', 'keywords', 'readme', 'homepage', 'license']
var otherThingsToFix = ['dependencies', 'people', 'typos']

var thingsToFix = fieldsToFix.map(function (fieldName) {
  return ucFirst(fieldName) + 'Field'
})
thingsToFix = thingsToFix.concat(otherThingsToFix)

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
  
  var context = {
    data: data,
    strict: strict,
    isPrivate: !!data.private
  }
  
  fixer.warn = function () {
    var args = Array.prototype.slice.call(arguments, 0)
    var warningMsg = makeWarning.apply(context, args)
    if (warningMsg !== null) {
      warn(warningMsg)
    }
  }
  thingsToFix.forEach(function (thingName) {
    fixer['fix' + ucFirst(thingName)](data, strict)
  })
  data._id = data.name + '@' + data.version
}

function ucFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
