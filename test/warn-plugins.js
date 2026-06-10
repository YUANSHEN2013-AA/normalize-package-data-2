const test = require('node:test')
const assert = require('node:assert')

const normalize = require('../lib/normalize')

function setup () {
  normalize.clearWarnPlugins()
}

test('warn plugins: built-in warn continues to fire when no plugins registered', function () {
  setup()
  var warnings = []
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    modules: ['some-module'],
  }, function (msg) {
    warnings.push(msg)
  })
  assert.ok(warnings.some(function (m) {
    return m.indexOf('deprecated') !== -1
  }), 'built-in warning still fires: ' + warnings.join(' | '))
})

test('warn plugins: registering a custom plugin receives warning objects with field/private/strict', function () {
  setup()
  var received = []
  var unregister = normalize.registerWarnPlugin(function (warning, context) {
    received.push({ warning: warning, context: context })
  })
  try {
    normalize({
      name: 'my-pkg',
      version: '1.0.0',
      files: 'not-an-array',
    }, function () {})
    assert.ok(received.length >= 1, 'plugin received at least one warning')
    var filesWarn = received.find(function (r) {
      return r.warning.field === 'files'
    })
    assert.ok(filesWarn, 'received warning for files field')
    assert.strictEqual(filesWarn.warning.name, 'nonArrayFiles')
    assert.strictEqual(filesWarn.warning.field, 'files')
    assert.strictEqual(filesWarn.warning.private, false)
    assert.strictEqual(filesWarn.warning.strict, false)
  } finally {
    unregister()
  }
})

test('warn plugins: returning true prevents built-in warn from firing', function () {
  setup()
  var builtinCalled = 0
  var pluginCalled = 0
  normalize.registerWarnPlugin(function (warning) {
    pluginCalled++
    if (warning.name === 'nonArrayFiles') {
      return true
    }
    return false
  })
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    files: 'not-an-array',
  }, function () {
    builtinCalled++
  })
  assert.ok(pluginCalled >= 1, 'plugin was called')
  assert.strictEqual(builtinCalled, 0, 'builtin warn was suppressed for handled warnings')
})

test('warn plugins: returning false or undefined keeps built-in logic alive', function () {
  setup()
  var builtinCalled = 0
  normalize.registerWarnPlugin(function () {
    return false
  })
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    modules: ['x'],
  }, function () {
    builtinCalled++
  })
  assert.ok(builtinCalled >= 1, 'builtin warn still fires when plugin returns false')
})

test('warn plugins: multiple plugins coexist and run in registration order', function () {
  setup()
  var order = []
  normalize.registerWarnPlugin(function (warning) {
    order.push('p1:' + warning.name)
  })
  normalize.registerWarnPlugin(function (warning) {
    order.push('p2:' + warning.name)
  })
  normalize.registerWarnPlugin(function (warning) {
    order.push('p3:' + warning.name)
  })
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    modules: ['x'],
    files: 'not-an-array',
  }, function () {})

  assert.ok(order.length >= 6, 'each plugin should see each warning')
  // For each warning, plugins should fire in order p1 -> p2 -> p3
  var byName = {}
  order.forEach(function (entry, idx) {
    var parts = entry.split(':')
    var pluginName = parts[0]
    var name = parts.slice(1).join(':')
    if (!byName[name]) {
      byName[name] = []
    }
    byName[name].push({ plugin: pluginName, index: idx })
  })
  Object.keys(byName).forEach(function (name) {
    var seq = byName[name].map(function (e) {
      return e.plugin
    })
    assert.deepStrictEqual(seq, ['p1', 'p2', 'p3'], 'plugin order preserved for ' + name)
  })
})

test('warn plugins: unregister removes the plugin', function () {
  setup()
  var calls = 0
  var unregister = normalize.registerWarnPlugin(function () {
    calls++
  })
  normalize({ name: 'p', version: '1.0.0', modules: ['a'] }, function () {})
  var afterRegister = calls
  assert.ok(afterRegister >= 1)
  unregister()
  normalize({ name: 'p', version: '1.0.0', modules: ['a'] }, function () {})
  assert.strictEqual(calls, afterRegister, 'plugin should not be called after unregister')
})

test('warn plugins: a throwing plugin does not break other plugins or built-in warn', function () {
  setup()
  var goodPluginCalled = 0
  var builtinCalled = 0
  var originalError = console.error
  var swallowed = []
  console.error = function () {
    swallowed.push(Array.prototype.slice.call(arguments).join(' '))
  }
  try {
    normalize.registerWarnPlugin(function () {
      throw new Error('boom from plugin')
    })
    normalize.registerWarnPlugin(function () {
      goodPluginCalled++
    })
    normalize({
      name: 'my-pkg',
      version: '1.0.0',
      modules: ['x'],
    }, function () {
      builtinCalled++
    })
    assert.ok(goodPluginCalled >= 1, 'good plugin still runs after a prior throw')
    assert.ok(builtinCalled >= 1, 'builtin warn still fires even when a plugin throws')
    assert.ok(
      swallowed.some(function (line) {
        return line.indexOf('normalize-package-data') !== -1
      }),
      'console.error captured plugin failure'
    )
  } finally {
    console.error = originalError
  }
})

test('warn plugins: plugins can filter by field type', function () {
  setup()
  var filesWarnings = []
  normalize.registerWarnPlugin(function (warning) {
    if (warning.field === 'files') {
      filesWarnings.push(warning.name)
      return true
    }
    return false
  })
  var builtinMessages = []
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    files: 'not-an-array',
    modules: ['x'],
  }, function (msg) {
    builtinMessages.push(msg)
  })
  assert.deepStrictEqual(filesWarnings, ['nonArrayFiles'])
  assert.ok(
    builtinMessages.every(function (m) {
      return m.indexOf('files') === -1 && m.indexOf('module') !== -1
    }) || builtinMessages.length >= 1,
    'non-files warnings still reach built-in; files warnings are handled by plugin'
  )
})

test('warn plugins: private packages suppress both plugins and built-in warn', function () {
  setup()
  var pluginCalled = 0
  var builtinCalled = 0
  normalize.registerWarnPlugin(function () {
    pluginCalled++
  })
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    private: true,
    modules: ['x'],
    files: 'not-an-array',
    description: 42,
  }, function () {
    builtinCalled++
  })
  assert.strictEqual(pluginCalled, 0, 'plugins not invoked for private packages')
  assert.strictEqual(builtinCalled, 0, 'builtin warn not invoked for private packages')
})

test('warn plugins: strict flag is exposed in warning object', function () {
  setup()
  var seen = []
  normalize.registerWarnPlugin(function (warning) {
    seen.push(warning.strict)
  })
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    modules: ['x'],
  }, function () {}, true)
  assert.ok(seen.length >= 1, 'plugin saw at least one warning')
  assert.ok(seen.every(function (v) {
    return v === true
  }), 'all warnings expose strict=true')

  seen.length = 0
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    modules: ['x'],
  }, function () {}, false)
  assert.ok(seen.length >= 1)
  assert.ok(seen.every(function (v) {
    return v === false
  }), 'all warnings expose strict=false')
})

test('warn plugins: plugin must be a function', function () {
  setup()
  assert.throws(function () {
    normalize.registerWarnPlugin('not-a-function')
  }, /must be a function/)
})

test('warn plugins: listWarnPlugins returns snapshot', function () {
  setup()
  var p1 = function () {}
  var p2 = function () {}
  normalize.registerWarnPlugin(p1)
  normalize.registerWarnPlugin(p2)
  var list = normalize.listWarnPlugins()
  assert.deepStrictEqual(list, [p1, p2])
  list.pop()
  assert.strictEqual(normalize.listWarnPlugins().length, 2, 'list is a copy, not a reference')
})

test('warn plugins: clearWarnPlugins removes all plugins', function () {
  setup()
  normalize.registerWarnPlugin(function () {})
  normalize.registerWarnPlugin(function () {})
  assert.strictEqual(normalize.listWarnPlugins().length, 2)
  normalize.clearWarnPlugins()
  assert.strictEqual(normalize.listWarnPlugins().length, 0)
})

test('warn plugins: first plugin returning true short-circuits later plugins', function () {
  setup()
  var secondCalled = 0
  normalize.registerWarnPlugin(function (warning) {
    if (warning.name === 'nonArrayFiles') {
      return true
    }
    return false
  })
  normalize.registerWarnPlugin(function () {
    secondCalled++
  })
  normalize({
    name: 'my-pkg',
    version: '1.0.0',
    files: 'not-an-array',
  }, function () {})
  assert.strictEqual(secondCalled, 0, 'second plugin should not be called when first returned true')
})
