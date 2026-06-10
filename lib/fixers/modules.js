module.exports = function (data) {
  if (data.modules) {
    this.warn('deprecatedModules')
    delete data.modules
  }
}
