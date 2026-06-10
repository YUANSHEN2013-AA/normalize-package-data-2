var plugins = []

module.exports = {
  register: registerPlugin,
  unregister: unregisterPlugin,
  execute: executePlugins,
  getPlugins: getPlugins,
  clearPlugins: clearPlugins,
}

function registerPlugin(plugin) {
  if (typeof plugin !== 'function') {
    throw new Error('Plugin must be a function')
  }
  if (!plugin.name || plugin.name === '') {
    plugin._pluginId = 'plugin_' + plugins.length
  } else {
    plugin._pluginId = plugin.name
  }
  if (!plugin.priority) {
    plugin.priority = 100
  }
  plugins.push(plugin)
  plugins.sort(function(a, b) {
    return (a.priority || 100) - (b.priority || 100)
  })
}

function unregisterPlugin(plugin) {
  var index = -1
  if (typeof plugin === 'function') {
    index = plugins.indexOf(plugin)
  } else if (typeof plugin === 'string') {
    for (var i = 0; i < plugins.length; i++) {
      if (plugins[i]._pluginId === plugin || plugins[i].name === plugin) {
        index = i
        break
      }
    }
  }
  if (index >= 0) {
    plugins.splice(index, 1)
    return true
  }
  return false
}

function executePlugins(warningName, args, context) {
  var results = []
  for (var i = 0; i < plugins.length; i++) {
    var plugin = plugins[i]
    try {
      var shouldWarn = plugin(warningName, args, context)
      if (shouldWarn === true) {
        results.push({ plugin: plugin._pluginId, action: 'warn' })
      } else if (shouldWarn === false) {
        results.push({ plugin: plugin._pluginId, action: 'suppress' })
      }
    } catch (err) {
      results.push({ plugin: plugin._pluginId, action: 'error', error: err })
    }
  }
  return results
}

function getPlugins() {
  return plugins.slice()
}

function clearPlugins() {
  plugins = []
}
