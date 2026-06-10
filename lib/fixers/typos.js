var typos = require('../typos.json')

module.exports = function (fixer) {
  return {
    fixTypos: function (data) {
      Object.keys(typos.topLevel).forEach(function (d) {
        if (Object.prototype.hasOwnProperty.call(data, d)) {
          fixer.warn('typo', d, typos.topLevel[d])
        }
      }, this)
    },
  }
}
