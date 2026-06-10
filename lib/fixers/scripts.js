var typos = require('../typos.json')

module.exports = function (fixer) {
  return {
    fixScriptsField: function (data) {
      if (!data.scripts) {
        return
      }
      if (typeof data.scripts !== 'object') {
        fixer.warn('nonObjectScripts')
        delete data.scripts
        return
      }
      Object.keys(data.scripts).forEach(function (k) {
        if (typeof data.scripts[k] !== 'string') {
          fixer.warn('nonStringScript')
          delete data.scripts[k]
        } else if (typos.script[k] && !data.scripts[typos.script[k]]) {
          fixer.warn('typo', k, typos.script[k], 'scripts')
        }
      }, this)
    },
  }
}
