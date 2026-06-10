var makeWarning = require('./make_warning')
var inferField = makeWarning.inferField

function WarnSystem () {
  this._plugins = []
}

WarnSystem.prototype.use = function (plugin) {
  if (typeof plugin !== 'function') {
    throw new TypeError('WarnSystem plugin must be a function')
  }
  this._plugins.push(plugin)
  return this
}

WarnSystem.prototype.createHandler = function (userWarn, data, strict) {
  var plugins = this._plugins
  var isPrivate = !!(data && data.private)

  return function () {
    var warningName = arguments[0]
    var args = Array.prototype.slice.call(arguments, 1)
    var field = inferField(warningName, args)

    var ctx = {
      warningName: warningName,
      args: args,
      field: field,
      isPrivate: isPrivate,
      strict: !!strict,
      data: data,
      message: null,
      suppressed: false,
    }

    for (var i = 0; i < plugins.length; i++) {
      try {
        plugins[i](ctx)
      } catch (_) {
        /* plugin errors are silently caught to avoid breaking the pipeline */
      }
      if (ctx.suppressed) {
        return
      }
    }

    if (!ctx.suppressed) {
      var msg = ctx.message || makeWarning.apply(null, arguments)
      if (typeof userWarn === 'function') {
        userWarn(msg)
      }
    }
  }
}

module.exports = {
  WarnSystem: WarnSystem,
  inferField: inferField,
}