var typos = require('../typos.json')

module.exports = {
  fixScriptsField: function (data) {
    if (!data.scripts) {
      return
    }
    if (typeof data.scripts !== 'object') {
      this.warn('nonObjectScripts')
      delete data.scripts
      return
    }
    Object.keys(data.scripts).forEach(function (k) {
      if (typeof data.scripts[k] !== 'string') {
        this.warn('nonStringScript')
        delete data.scripts[k]
      } else if (typos.script[k] && !data.scripts[typos.script[k]]) {
        this.warn('typo', k, typos.script[k], 'scripts')
      }
    }, this)
  },
}
