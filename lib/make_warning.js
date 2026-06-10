var util = require('util')
var messages = require('./warning_messages.json')
var warnPlugin = require('./warn_plugin')

module.exports = function () {
  var args = Array.prototype.slice.call(arguments, 0)
  var warningName = args.shift()
  var context = this || {}
  
  var pluginResults = warnPlugin.execute(warningName, args, context)
  
  var hasSuppress = false
  var hasError = false
  for (var i = 0; i < pluginResults.length; i++) {
    if (pluginResults[i].action === 'suppress') {
      hasSuppress = true
      break
    }
    if (pluginResults[i].action === 'error') {
      hasError = true
    }
  }
  
  if (hasSuppress) {
    return null
  }
  
  if (warningName === 'typo') {
    return makeTypoWarning.apply(null, args)
  } else {
    var msgTemplate = messages[warningName] ? messages[warningName] : warningName + ": '%s'"
    args.unshift(msgTemplate)
    return util.format.apply(null, args)
  }
}

function makeTypoWarning (providedName, probableName, field) {
  if (field) {
    providedName = field + "['" + providedName + "']"
    probableName = field + "['" + probableName + "']"
  }
  return util.format(messages.typo, providedName, probableName)
}

module.exports.registerPlugin = warnPlugin.register
module.exports.unregisterPlugin = warnPlugin.unregister
module.exports.getPlugins = warnPlugin.getPlugins
module.exports.clearPlugins = warnPlugin.clearPlugins
