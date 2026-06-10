module.exports = {
  fixModulesField: function (data) {
    if (data.modules) {
      this.warn('deprecatedModules')
      delete data.modules
    }
  },
}
