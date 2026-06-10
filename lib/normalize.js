module.exports = normalize

var fixer = require('./fixer')
normalize.fixer = fixer

var warnPlugins = require('./warn_plugins')
var pluginsController = warnPlugins.createPluginsController()

normalize.registerWarnPlugin = function (plugin) {
  return pluginsController.register(plugin)
}
normalize.listWarnPlugins = function () {
  return pluginsController.list()
}
normalize.clearWarnPlugins = function () {
  pluginsController.clear()
}

var fieldsToFix = ['name', 'version', 'description', 'repository', 'modules', 'scripts',
  'files', 'bin', 'man', 'bugs', 'keywords', 'readme', 'homepage', 'license']
var otherThingsToFix = ['dependencies', 'people', 'typos']

var fieldByThing = {
  NameField: 'name',
  VersionField: 'version',
  DescriptionField: 'description',
  RepositoryField: 'repository',
  ModulesField: 'modules',
  ScriptsField: 'scripts',
  FilesField: 'files',
  BinField: 'bin',
  ManField: 'man',
  BugsField: 'bugs',
  KeywordsField: 'keywords',
  ReadmeField: 'readme',
  HomepageField: 'homepage',
  LicenseField: 'license',
  Dependencies: 'dependencies',
  People: 'author/contributors',
  Typos: 'typos',
}

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
  var builtinWarn
  if (!warn || data.private) {
    builtinWarn = function () { /* noop */ }
  } else {
    builtinWarn = warn
  }

  if (data.scripts &&
      data.scripts.install === 'node-gyp rebuild' &&
      !data.scripts.preinstall) {
    data.gypfile = true
  }

  thingsToFix.forEach(function (thingName) {
    var baseContext = {
      data: data,
      field: fieldByThing[thingName] || thingName,
      private: !!data.private,
      strict: !!strict,
      builtinWarn: builtinWarn,
    }
    fixer.warn = warnPlugins.createDispatcher(baseContext)
    fixer['fix' + ucFirst(thingName)](data, strict)
  })
  data._id = data.name + '@' + data.version
}

function ucFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
