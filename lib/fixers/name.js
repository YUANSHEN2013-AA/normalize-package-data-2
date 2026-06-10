var { isBuiltin } = require('node:module')

module.exports = function (fixer) {
  function isValidScopedPackageName (spec) {
    if (spec.charAt(0) !== '@') {
      return false
    }

    var rest = spec.slice(1).split('/')
    if (rest.length !== 2) {
      return false
    }

    return rest[0] && rest[1] &&
      rest[0] === encodeURIComponent(rest[0]) &&
      rest[1] === encodeURIComponent(rest[1])
  }

  function isCorrectlyEncodedName (spec) {
    return !spec.match(/[/@\s+%:]/) &&
      spec === encodeURIComponent(spec)
  }

  function ensureValidName (name, strict, allowLegacyCase) {
    if (name.charAt(0) === '.' ||
        !(isValidScopedPackageName(name) || isCorrectlyEncodedName(name)) ||
        (strict && (!allowLegacyCase) && name !== name.toLowerCase()) ||
        name.toLowerCase() === 'node_modules' ||
        name.toLowerCase() === 'favicon.ico') {
      throw new Error('Invalid name: ' + JSON.stringify(name))
    }
  }

  return {
    fixNameField: function (data, options) {
      if (typeof options === 'boolean') {
        options = { strict: options }
      } else if (typeof options === 'undefined') {
        options = {}
      }
      var strict = options.strict
      if (!data.name && !strict) {
        data.name = ''
        return
      }
      if (typeof data.name !== 'string') {
        throw new Error('name field must be a string.')
      }
      if (!strict) {
        data.name = data.name.trim()
      }
      ensureValidName(data.name, strict, options.allowLegacyCase)
      if (isBuiltin(data.name)) {
        fixer.warn('conflictingName', data.name)
      }
    },
  }
}
