var util = require('util')
var messages = require('./warning_messages.json')

var warningHandlers = []
var warningFields = {
  repositories: 'repository',
  missingRepository: 'repository',
  brokenGitUrl: 'repository',
  nonObjectScripts: 'scripts',
  nonStringScript: 'scripts',
  nonArrayFiles: 'files',
  invalidFilename: 'files',
  nonArrayBundleDependencies: 'bundleDependencies',
  nonStringBundleDependency: 'bundleDependencies',
  nonDependencyBundleDependency: 'bundleDependencies',
  deprecatedModules: 'modules',
  nonArrayKeywords: 'keywords',
  nonStringKeyword: 'keywords',
  conflictingName: 'name',
  nonStringDescription: 'description',
  missingDescription: 'description',
  missingReadme: 'readme',
  nonEmailUrlBugsString: 'bugs',
  nonUrlBugsUrlField: 'bugs',
  nonEmailBugsEmailField: 'bugs',
  emptyNormalizedBugs: 'bugs',
  nonUrlHomepage: 'homepage',
  missingLicense: 'license',
  invalidLicense: 'license',
}

module.exports = makeWarning

makeWarning.emit = emitWarning
makeWarning.registerWarningHandler = registerWarningHandler
makeWarning.clearWarningHandlers = clearWarningHandlers

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

function emitWarning (options) {
  var context = createWarningContext(options)

  warningHandlers.forEach(function (plugin, index) {
    try {
      if (shouldTrigger(plugin, context)) {
        plugin.handler(context)
      }
    } catch (error) {
      context.errors.push({
        handler: plugin.name || ('handler-' + index),
        error: error,
      })
    }
  })

  defaultWarningHandler(context)
  return context
}

function registerWarningHandler (plugin) {
  var normalized = normalizeWarningHandler(plugin)
  warningHandlers.push(normalized)
  return function unregisterWarningHandler () {
    var index = warningHandlers.indexOf(normalized)
    if (index !== -1) {
      warningHandlers.splice(index, 1)
    }
  }
}

function clearWarningHandlers () {
  warningHandlers.length = 0
}

function normalizeWarningHandler (plugin) {
  if (typeof plugin === 'function') {
    return { handler: plugin }
  }

  if (!plugin || (typeof plugin.handler !== 'function' && typeof plugin.handle !== 'function')) {
    throw new TypeError('warning handler must be a function or an object with a handler function')
  }

  return {
    name: plugin.name,
    fieldType: plugin.fieldType,
    private: plugin.private,
    strict: plugin.strict,
    shouldHandle: plugin.shouldHandle,
    handler: plugin.handler || plugin.handle,
  }
}

function shouldTrigger (plugin, context) {
  return matchesCondition(plugin.fieldType, context.fieldType, context) &&
    matchesCondition(plugin.private, context.isPrivate, context) &&
    matchesCondition(plugin.strict, context.strict, context) &&
    matchesCondition(plugin.shouldHandle, context, context)
}

function matchesCondition (condition, value, context) {
  if (typeof condition === 'undefined') {
    return true
  }
  if (typeof condition === 'function') {
    return !!condition(value, context)
  }
  if (Array.isArray(condition)) {
    return condition.indexOf(value) !== -1
  }
  return condition === value
}

function createWarningContext (options) {
  var args = options.args ? options.args.slice() : []
  var field = resolveFieldType(options.warningName, args)

  return {
    name: options.warningName,
    code: options.warningName,
    args: args,
    message: makeWarning.apply(null, [options.warningName].concat(args)),
    field: field,
    fieldType: field,
    strict: !!options.strict,
    isPrivate: !!(options.data && options.data.private),
    data: options.data,
    warn: options.warn,
    errors: [],
  }
}

function defaultWarningHandler (context) {
  if (typeof context.warn === 'function' && !context.isPrivate) {
    context.warn(context.message)
  }
}

function resolveFieldType (warningName, args) {
  if (warningName === 'typo') {
    return args[2] || args[0]
  }
  if (warningName === 'deprecatedArrayDependencies' || warningName === 'nonObjectDependencies') {
    return args[0]
  }
  if (warningName === 'nonStringDependency') {
    return 'dependencies'
  }
  return warningFields[warningName] || null
}

function makeTypoWarning (providedName, probableName, field) {
  if (field) {
    providedName = field + "['" + providedName + "']"
    probableName = field + "['" + probableName + "']"
  }
  return util.format(messages.typo, providedName, probableName)
}
