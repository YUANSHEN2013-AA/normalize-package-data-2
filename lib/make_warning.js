var util = require('util')
var messages = require('./warning_messages.json')

var plugins = []

function makeWarning () {
  var args = Array.prototype.slice.call(arguments, 0)
  var warningName = args.shift()
  if (warningName === 'typo') {
    return makeTypoWarning.apply(null, args)
  } else {
    var msgTemplate = messages[warningName] ? messages[warningName] : warningName + ": '%s'"
    args.unshift(msgTemplate)
    return util.format.apply(null, args)
  }
}

makeWarning.addWarningPlugin = function (plugin) {
  plugins.push(plugin)
}

makeWarning.clearWarningPlugins = function () {
  plugins = []
}

makeWarning.processWarning = function (info, originalWarn) {
  var message = makeWarning.apply(null, [info.warningName].concat(info.args))
  info.message = message

  var shouldWarn = !info.isPrivate
  for (var i = 0; i < plugins.length; i++) {
    try {
      var result = plugins[i](info)
      if (typeof result === 'boolean') {
        shouldWarn = result
      }
    } catch (e) {
      // Ignore plugin exceptions
    }
  }
  if (shouldWarn && typeof originalWarn === 'function') {
    originalWarn(info.message)
  }
}

function makeTypoWarning (providedName, probableName, field) {

  if (field) {
    providedName = field + "['" + providedName + "']"
    probableName = field + "['" + probableName + "']"
  }
  return util.format(messages.typo, providedName, probableName)
}

module.exports = makeWarning
