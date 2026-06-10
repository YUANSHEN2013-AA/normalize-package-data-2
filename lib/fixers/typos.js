var typos = require('../typos.json')

module.exports = function (data) {
  Object.keys(typos.topLevel).forEach(function (d) {
    if (Object.prototype.hasOwnProperty.call(data, d)) {
      this.warn('typo', d, typos.topLevel[d])
    }
  }, this)
}
