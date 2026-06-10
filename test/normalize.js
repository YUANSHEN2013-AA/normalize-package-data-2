const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const normalize = require('../lib/normalize')
const warningMessages = require('../lib/warning_messages.json')
const safeFormat = require('../lib/safe_format')
const makeWarning = require('../lib/make_warning')

const rpjPath = path.resolve(__dirname, './fixtures/read-package-json.json')

test('normalize some package data', function (t, done) {
  var packageData = require(rpjPath)
  var warnings = []
  normalize(packageData, function (warning) {
    warnings.push(warning)
  })
  // there's no readme data in this particular object
  assert.strictEqual(warnings.length, 1, "There's exactly one warning.")
  fs.readFile(rpjPath, function (err, data) {
    if (err) {
      throw err
    }
    // Various changes have been made
    assert.notDeepStrictEqual(packageData, JSON.parse(data), 'Output is different from input.')
    done()
  })
})

test('runs without passing warning function', function (t, done) {
  fs.readFile(rpjPath, function (err, data) {
    if (err) {
      throw err
    }
    normalize(JSON.parse(data))
    assert.ok(true, "If you read this, this means I'm still alive.")
    done()
  })
})

test('empty object', function () {
  var packageData = {}
  var expect =
    { name: '',
      version: '',
      readme: 'ERROR: No README data found!',
      _id: '@' }

  var warnings = []
  function warn (m) {
    warnings.push(m)
  }
  normalize(packageData, warn)
  assert.deepStrictEqual(packageData, expect)
  assert.deepStrictEqual(warnings, [
    warningMessages.missingDescription,
    warningMessages.missingRepository,
    warningMessages.missingReadme,
    warningMessages.missingLicense,
  ])
})

test('core module name', function () {
  var warnings = []
  function warn (m) {
    warnings.push(m)
  }
  var coreModules = ['http', 'stream']
  var expect = []
  for (var i = 0; i < coreModules.length; ++i) {
    normalize({
      name: coreModules[i],
      readme: 'read yourself how about',
      homepage: 123,
      bugs: "what is this i don't even",
      repository: 'Hello.',
    }, warn)

    expect = expect.concat([
      safeFormat(warningMessages.conflictingName, coreModules[i]),
      warningMessages.nonEmailUrlBugsString,
      warningMessages.emptyNormalizedBugs,
      warningMessages.nonUrlHomepage,
      warningMessages.missingLicense,
    ])
  }
  assert.deepStrictEqual(warnings, expect)
})

test('urls required', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  normalize({
    bugs: {
      url: '/1',
      email: 'not an email address',
    },
  }, warn)
  normalize({
    readme: 'read yourself how about',
    homepage: 123,
    bugs: "what is this i don't even",
    repository: 'Hello.',
  }, warn)

  var expect =
    [warningMessages.missingDescription,
      warningMessages.missingRepository,
      warningMessages.nonUrlBugsUrlField,
      warningMessages.nonEmailBugsEmailField,
      warningMessages.emptyNormalizedBugs,
      warningMessages.missingReadme,
      warningMessages.missingLicense,
      warningMessages.nonEmailUrlBugsString,
      warningMessages.emptyNormalizedBugs,
      warningMessages.nonUrlHomepage,
      warningMessages.missingLicense]
  assert.deepStrictEqual(warnings, expect)
})

test('homepage field must start with a protocol.', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var a
  normalize(a = {
    homepage: 'example.org',
  }, warn)

  var expect =
    [warningMessages.missingDescription,
      warningMessages.missingRepository,
      warningMessages.missingReadme,
      warningMessages.missingLicense]
  assert.deepStrictEqual(warnings, expect)
  assert.deepStrictEqual(a.homepage, 'http://example.org')
})

test('license field should be a valid SPDX expression', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  normalize({
    license: 'Apache 2',
  }, warn)

  var expect =
    [warningMessages.missingDescription,
      warningMessages.missingRepository,
      warningMessages.missingReadme,
      warningMessages.invalidLicense]
  assert.deepStrictEqual(warnings, expect)
})

test("don't fail when license is just a space", function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  normalize({
    license: ' ',
  }, warn)

  var expect =
    [warningMessages.missingDescription,
      warningMessages.missingRepository,
      warningMessages.missingReadme,
      warningMessages.invalidLicense]
  assert.deepStrictEqual(warnings, expect)
})

test("don't fail when license is licence", function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  normalize({
    description: 'description',
    readme: 'readme',
    repository: 'https://npmjs.org',
    licence: 'MIT',
  }, warn)

  assert.deepStrictEqual(warnings, [])
})

test('gist bugs url', function () {
  var d = {
    repository: 'git@gist.github.com:1234567.git',
  }
  normalize(d)
  assert.deepStrictEqual(d.repository, { type: 'git', url: 'git+ssh://git@gist.github.com/1234567.git' })
  assert.deepStrictEqual(d.bugs, { url: 'https://gist.github.com/1234567' })
})

test('singularize repositories', function () {
  var d = { repositories: ['git@gist.github.com:1234567.git'] }
  normalize(d)
  assert.deepStrictEqual(d.repository, { type: 'git', url: 'git+ssh://git@gist.github.com/1234567.git' })
})

test('treat visionmedia/express as github repo', function () {
  var d = { repository: { type: 'git', url: 'visionmedia/express' } }
  normalize(d)
  assert.deepStrictEqual(d.repository, { type: 'git', url: 'git+https://github.com/visionmedia/express.git' })
})

test('treat isaacs/node-graceful-fs as github repo', function () {
  var d = { repository: { type: 'git', url: 'isaacs/node-graceful-fs' } }
  normalize(d)
  assert.deepStrictEqual(d.repository, { type: 'git', url: 'git+https://github.com/isaacs/node-graceful-fs.git' })
})

test('homepage field will set to github url if repository is a github repo', function () {
  var a
  normalize(a = {
    repository: { type: 'git', url: 'https://github.com/isaacs/node-graceful-fs' },
  })
  assert.deepStrictEqual(a.homepage, 'https://github.com/isaacs/node-graceful-fs#readme')
})

test('homepage field will set to github gist url if repository is a gist', function () {
  var a
  normalize(a = {
    repository: { type: 'git', url: 'git@gist.github.com:1234567.git' },
  })
  assert.deepStrictEqual(a.homepage, 'https://gist.github.com/1234567')
})

/* eslint-disable-next-line max-len */
test('homepage field will set to github gist url if repository is a shorthand reference', function () {
  var a
  normalize(a = {
    repository: { type: 'git', url: 'sindresorhus/chalk' },
  })
  assert.deepStrictEqual(a.homepage, 'https://github.com/sindresorhus/chalk#readme')
})

test("don't mangle github shortcuts in dependencies", function () {
  var d = { dependencies: { 'node-graceful-fs': 'isaacs/node-graceful-fs' } }
  normalize(d)
  assert.deepStrictEqual(d.dependencies, { 'node-graceful-fs': 'github:isaacs/node-graceful-fs' })
})

test('deprecation warning for string in dependencies fields', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var data = {
    name: 'test-package',
    version: '1.0.0',
    dependencies: 'express@4.0.0, lodash@3.0.0',
  }
  normalize(data, warn)
  assert.ok(typeof data.dependencies === 'object', 'string dependencies converted to object')
  assert.ok(data.dependencies.express, 'express dependency parsed')
  assert.ok(data.dependencies.lodash, 'lodash dependency parsed')
  assert.ok(
    warnings.includes(safeFormat(warningMessages.deprecatedArrayDependencies, 'dependencies')),
    'deprecation warning for string dependencies'
  )
})

test('deprecation warning for array in dependencies fields', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  normalize({
    dependencies: [],
    devDependencies: [],
    optionalDependencies: [],
  }, warn)
  assert.ok(
    warnings.includes(safeFormat(warningMessages.deprecatedArrayDependencies, 'dependencies')),
    'deprecation warning'
  )
  assert.ok(
    warnings.includes(safeFormat(warningMessages.deprecatedArrayDependencies, 'devDependencies')),
    'deprecation warning'
  )
  assert.ok(
    warnings.includes(
      safeFormat(warningMessages.deprecatedArrayDependencies, 'optionalDependencies')
    ),
    'deprecation warning'
  )
})

test('removes non-array files field', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var data = {
    name: 'test-package',
    version: '1.0.0',
    files: 'not an array',
  }
  normalize(data, warn)
  assert.strictEqual(data.files, undefined, 'non-array files field should be removed')
  assert.ok(
    warnings.some(w => w.includes("Invalid 'files' member")),
    'should warn about non-array files field'
  )
})

test('filters out invalid filenames from files array', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var data = {
    name: 'test-package',
    version: '1.0.0',
    files: [
      'valid-file.js',
      'src/another-valid.js',
      null,
      '',
      123,
      { file: 'object.js' },
      'README.md',
    ],
  }
  normalize(data, warn)
  assert.deepStrictEqual(
    data.files,
    ['valid-file.js', 'src/another-valid.js', 'README.md'],
    'only valid string filenames should remain'
  )
  assert.ok(
    warnings.some(w => w.includes("Invalid filename in 'files' list")),
    'should warn about invalid filenames'
  )
})

test('converts string man field to array', function () {
  var data = {
    name: 'test-package',
    version: '1.0.0',
    man: './man/doc.1',
  }
  normalize(data)
  assert.ok(Array.isArray(data.man), 'man field should be converted to array')
  assert.deepStrictEqual(data.man, ['./man/doc.1'], 'man field should contain the original string')
})

test('leaves array man field unchanged', function () {
  var data = {
    name: 'test-package',
    version: '1.0.0',
    man: ['./man/doc.1', './man/doc.2'],
  }
  normalize(data)
  assert.ok(Array.isArray(data.man), 'man field should remain an array')
  assert.deepStrictEqual(
    data.man,
    ['./man/doc.1', './man/doc.2'],
    'man field should remain unchanged'
  )
})

test('warns about deprecated modules field', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var data = {
    name: 'test-package',
    version: '1.0.0',
    modules: ['some', 'modules'],
  }
  normalize(data, warn)
  assert.strictEqual(data.modules, undefined, 'modules field should be removed')
  assert.ok(
    warnings.some(w => w.includes('modules field is deprecated')),
    'should warn about deprecated modules field'
  )
})

test('converts string keywords to array', function () {
  var data = {
    name: 'test-package',
    version: '1.0.0',
    keywords: 'javascript, node, testing, awesome',
  }
  normalize(data)
  assert.ok(Array.isArray(data.keywords), 'keywords should be converted to array')
  assert.deepStrictEqual(
    data.keywords,
    ['javascript', 'node', 'testing', 'awesome'],
    'keywords should be split by comma and space'
  )
})

test('leaves array keywords unchanged', function () {
  var data = {
    name: 'test-package',
    version: '1.0.0',
    keywords: ['javascript', 'node', 'testing'],
  }
  normalize(data)
  assert.ok(Array.isArray(data.keywords), 'keywords should remain an array')
  assert.deepStrictEqual(
    data.keywords,
    ['javascript', 'node', 'testing'],
    'keywords should remain unchanged'
  )
})

test('removes non-array keywords and warns', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var data = {
    name: 'test-package',
    version: '1.0.0',
    keywords: { key: 'value' },
  }
  normalize(data, warn)
  assert.strictEqual(data.keywords, undefined, 'non-array keywords should be removed')
  assert.ok(
    warnings.some(w => w.includes('keywords should be an array of strings')),
    'should warn about non-array keywords'
  )
})

test('filters out non-string keywords from array', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var data = {
    name: 'test-package',
    version: '1.0.0',
    keywords: ['valid', 123, null, '', { key: 'value' }, 'another-valid'],
  }
  normalize(data, warn)
  assert.deepStrictEqual(
    data.keywords,
    ['valid', 'another-valid'],
    'only valid string keywords should remain'
  )
  assert.ok(
    warnings.some(w => w.includes('keywords should be an array of strings')),
    'should warn about non-string keywords'
  )
})

test('removes non-string description and warns', function () {
  var warnings = []
  function warn (w) {
    warnings.push(w)
  }
  var data = {
    name: 'test-package',
    version: '1.0.0',
    description: { text: 'should be a string' },
  }
  normalize(data, warn)
  assert.strictEqual(data.description, undefined, 'non-string description should be removed')
  assert.ok(
    warnings.some(w => w.includes("'description' field should be a string")),
    'should warn about non-string description'
  )
})

test('makeWarning handles unknown warning types with fallback format', function () {
  var result = makeWarning('unknownWarningType', 'someValue')
  assert.strictEqual(result, "unknownWarningType: 'someValue'", 'should use fallback format for unknown warnings')
})

test('passing true as warn parameter enables strict mode', function () {
  assert.throws(
    () => normalize({ name: 'UpperCase', version: '1.0.0' }, true),
    { message: /Invalid name/ },
    'strict mode should reject uppercase names'
  )
})

test('normalizes shortcut repository format to https', function () {
  var data = {
    name: 'test-package',
    version: '1.0.0',
    repository: 'github:user/repo',
  }
  normalize(data)
  assert.strictEqual(data.repository.type, 'git', 'type should be git')
})

test('plugin system: register and execute single plugin', function () {
  normalize.clearPlugins()
  var pluginCalls = []
  
  function testPlugin(warningName, args, context) {
    pluginCalls.push({ name: warningName, context: context })
    return true
  }
  testPlugin.priority = 50
  
  normalize.registerPlugin(testPlugin)
  
  var warnings = []
  normalize({
    name: 'test-package',
    version: '1.0.0',
  }, function(w) { warnings.push(w) })
  
  assert.ok(pluginCalls.length > 0, 'plugin should be called')
  assert.ok(pluginCalls[0].context, 'plugin should receive context')
  
  normalize.clearPlugins()
})

test('plugin system: multiple plugins coexist', function () {
  normalize.clearPlugins()
  var plugin1Calls = []
  var plugin2Calls = []
  var plugin3Calls = []
  
  function plugin1(warningName) {
    plugin1Calls.push(warningName)
    return true
  }
  plugin1.priority = 10
  
  function plugin2(warningName) {
    plugin2Calls.push(warningName)
    return true
  }
  plugin2.priority = 20
  
  function plugin3(warningName) {
    plugin3Calls.push(warningName)
    return true
  }
  plugin3.priority = 30
  
  normalize.registerPlugin(plugin1)
  normalize.registerPlugin(plugin2)
  normalize.registerPlugin(plugin3)
  
  normalize({
    name: 'test-package',
    version: '1.0.0',
  }, function() {})
  
  assert.ok(plugin1Calls.length > 0, 'plugin1 should be called')
  assert.ok(plugin2Calls.length > 0, 'plugin2 should be called')
  assert.ok(plugin3Calls.length > 0, 'plugin3 should be called')
  
  normalize.clearPlugins()
})

test('plugin system: plugin can suppress warnings', function () {
  normalize.clearPlugins()
  
  function suppressMissingReadme(warningName) {
    if (warningName === 'missingReadme') {
      return false
    }
    return true
  }
  suppressMissingReadme.priority = 10
  
  normalize.registerPlugin(suppressMissingReadme)
  
  var warnings = []
  normalize({}, function(w) { warnings.push(w) })
  
  var hasReadmeWarning = warnings.some(function(w) {
    return w.includes('README')
  })
  assert.strictEqual(hasReadmeWarning, false, 'missingReadme warning should be suppressed')
  
  normalize.clearPlugins()
})

test('plugin system: plugin error handling does not break flow', function () {
  normalize.clearPlugins()
  
  function throwingPlugin(warningName) {
    if (warningName === 'missingDescription') {
      throw new Error('Plugin error')
    }
    return true
  }
  throwingPlugin.priority = 10
  
  function normalPlugin(warningName) {
    return true
  }
  normalPlugin.priority = 20
  
  normalize.registerPlugin(throwingPlugin)
  normalize.registerPlugin(normalPlugin)
  
  var warnings = []
  assert.doesNotThrow(function() {
    normalize({}, function(w) { warnings.push(w) })
  }, 'plugin errors should not break normalization')
  
  assert.ok(warnings.length > 0, 'warnings should still be generated')
  
  normalize.clearPlugins()
})

test('plugin system: plugin execution order follows priority', function () {
  normalize.clearPlugins()
  var executionOrder = []
  
  function lowPriority() {
    executionOrder.push('low')
    return true
  }
  lowPriority.priority = 200
  
  function highPriority() {
    executionOrder.push('high')
    return true
  }
  highPriority.priority = 1
  
  function mediumPriority() {
    executionOrder.push('medium')
    return true
  }
  mediumPriority.priority = 100
  
  normalize.registerPlugin(lowPriority)
  normalize.registerPlugin(highPriority)
  normalize.registerPlugin(mediumPriority)
  
  normalize({
    name: 'test-package',
    version: '1.0.0',
  }, function() {})
  
  assert.strictEqual(executionOrder[0], 'high', 'high priority plugin should execute first')
  assert.strictEqual(executionOrder[1], 'medium', 'medium priority plugin should execute second')
  assert.strictEqual(executionOrder[2], 'low', 'low priority plugin should execute last')
  
  normalize.clearPlugins()
})

test('plugin system: unregister plugin by function reference', function () {
  normalize.clearPlugins()
  
  function testPlugin() {
    return true
  }
  
  normalize.registerPlugin(testPlugin)
  assert.strictEqual(normalize.getPlugins().length, 1, 'plugin should be registered')
  
  var result = normalize.unregisterPlugin(testPlugin)
  assert.strictEqual(result, true, 'unregister should return true')
  assert.strictEqual(normalize.getPlugins().length, 0, 'plugin should be unregistered')
  
  normalize.clearPlugins()
})

test('plugin system: unregister plugin by name', function () {
  normalize.clearPlugins()
  
  function namedPlugin() {
    return true
  }
  
  normalize.registerPlugin(namedPlugin)
  var result = normalize.unregisterPlugin('namedPlugin')
  assert.strictEqual(result, true, 'unregister by name should return true')
  assert.strictEqual(normalize.getPlugins().length, 0, 'plugin should be unregistered')
  
  normalize.clearPlugins()
})

test('plugin system: reject non-function plugin', function () {
  normalize.clearPlugins()
  
  assert.throws(function() {
    normalize.registerPlugin('not a function')
  }, /Plugin must be a function/)
  
  normalize.clearPlugins()
})

test('plugin system: plugin receives warning arguments', function () {
  normalize.clearPlugins()
  
  var receivedArgs = null
  
  function argsCapturePlugin(warningName, args, context) {
    receivedArgs = { name: warningName, args: args }
    return true
  }
  
  normalize.registerPlugin(argsCapturePlugin)
  
  normalize({
    name: 'test-package',
    version: '1.0.0',
    license: 'Invalid License',
  }, function() {})
  
  assert.ok(receivedArgs, 'plugin should receive data')
  
  normalize.clearPlugins()
})

test('plugin system: plugin can access strict mode flag', function () {
  normalize.clearPlugins()
  
  var strictModeDetected = false
  
  function strictCheckPlugin(warningName, args, context) {
    if (context && context.strict === true) {
      strictModeDetected = true
    }
    return true
  }
  
  normalize.registerPlugin(strictCheckPlugin)
  
  normalize({
    name: 'test-package',
    version: '1.0.0',
  }, function() {}, true)
  
  assert.strictEqual(strictModeDetected, true, 'plugin should detect strict mode')
  
  normalize.clearPlugins()
})

test('plugin system: plugin can access private package flag', function () {
  normalize.clearPlugins()
  
  var privatePackageDetected = false
  
  function privateCheckPlugin(warningName, args, context) {
    if (context && context.isPrivate === true) {
      privatePackageDetected = true
    }
    return true
  }
  
  normalize.registerPlugin(privateCheckPlugin)
  
  normalize({
    name: 'test-package',
    version: '1.0.0',
    private: true,
  }, function() {})
  
  assert.strictEqual(privatePackageDetected, true, 'plugin should detect private package')
  
  normalize.clearPlugins()
})

test('plugin system: clear all plugins', function () {
  normalize.registerPlugin(function plugin1() { return true })
  normalize.registerPlugin(function plugin2() { return true })
  normalize.registerPlugin(function plugin3() { return true })
  
  assert.strictEqual(normalize.getPlugins().length, 3, 'should have 3 plugins')
  
  normalize.clearPlugins()
  assert.strictEqual(normalize.getPlugins().length, 0, 'all plugins should be cleared')
})

test('plugin system: built-in warnings continue working with plugins', function () {
  normalize.clearPlugins()
  
  function passivePlugin() {
    return true
  }
  
  normalize.registerPlugin(passivePlugin)
  
  var warnings = []
  normalize({}, function(w) { warnings.push(w) })
  
  assert.ok(warnings.length > 0, 'built-in warnings should still fire')
  
  normalize.clearPlugins()
})

test('plugin system: getPlugins returns copy not reference', function () {
  normalize.clearPlugins()
  
  function testPlugin() { return true }
  normalize.registerPlugin(testPlugin)
  
  var plugins1 = normalize.getPlugins()
  var plugins2 = normalize.getPlugins()
  
  assert.notStrictEqual(plugins1, plugins2, 'getPlugins should return new array each time')
  assert.deepStrictEqual(plugins1, plugins2, 'arrays should have same content')
  
  normalize.clearPlugins()
})
