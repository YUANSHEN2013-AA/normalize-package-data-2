var util = require('util')
var messages = require('./warning_messages.json')

var fieldMap = {
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
  nonObjectDependencies: 'dependencies',
  nonStringDependency: 'dependencies',
  deprecatedArrayDependencies: 'dependencies',
  deprecatedModules: 'modules',
  nonArrayKeywords: 'keywords',
  nonStringKeyword: 'keywords',
  conflictingName: 'name',
  nonStringDescription: 'description',
  missingDescription: 'description',
  missingReadme: 'readme',
  missingLicense: 'license',
  nonEmailUrlBugsString: 'bugs',
  nonUrlBugsUrlField: 'bugs',
  nonEmailBugsEmailField: 'bugs',
  emptyNormalizedBugs: 'bugs',
  nonUrlHomepage: 'homepage',
  invalidLicense: 'license',
  typo: null,
}

function inferField (warningName, args) {
  if (warningName === 'typo' && args && args.length >= 2) {
    if (args.length >= 3) {
      return args[2]
    }
    return null
  }
  return fieldMap[warningName] || null
}

module.exports = function () {
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

module.exports.inferField = inferField

function makeTypoWarning (providedName, probableName, field) {
  if (field) {
    providedName = field + "['" + providedName + "']"
    probableName = field + "['" + probableName + "']"
  }
  return util.format(messages.typo, providedName, probableName)
}
