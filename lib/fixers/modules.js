module.exports = function (fixer) {
  return {
    fixModulesField: function (data) {
      if (data.modules) {
        fixer.warn('deprecatedModules')
        delete data.modules
      }
    },
  }
}
