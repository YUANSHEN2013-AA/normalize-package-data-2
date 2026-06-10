var makeWarning = require('./make_warning')

var plugins = []

function createPluginsController () {
  return {
    register: function (plugin) {
      if (typeof plugin !== 'function') {
        throw new TypeError('warn plugin must be a function')
      }
      plugins.push(plugin)
      return function unregister () {
        var idx = plugins.indexOf(plugin)
        if (idx !== -1) {
          plugins.splice(idx, 1)
        }
      }
    },
    list: function () {
      return plugins.slice()
    },
    clear: function () {
      plugins.length = 0
    },
  }
}

function createDispatcher (context) {
  return function dispatcher (messageName /* , ...formatArgs */) {
    var formatArgs = Array.prototype.slice.call(arguments, 1)
    var formatted = makeWarning.apply(null, arguments)

    var warning = {
      name: messageName,
      message: formatted,
      args: formatArgs,
      field: context.field,
      private: context.private,
      strict: context.strict,
    }

    if (context.private) {
      return
    }

    var handled = false
    for (var i = 0; i < plugins.length; i++) {
      var plugin = plugins[i]
      try {
        var result = plugin(warning, context)
        if (result === true) {
          handled = true
          break
        }
      } catch (pluginError) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[normalize-package-data] warn plugin threw:', pluginError)
        }
      }
    }

    if (!handled && typeof context.builtinWarn === 'function') {
      try {
        context.builtinWarn(formatted, warning)
      } catch (builtinError) {
        if (typeof console !== 'undefined' && console.error) {
          console.error('[normalize-package-data] builtin warn threw:', builtinError)
        }
      }
    }
  }
}

module.exports = {
  createPluginsController: createPluginsController,
  createDispatcher: createDispatcher,
}
