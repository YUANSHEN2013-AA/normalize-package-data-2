module.exports = function (fixer) {
  return {
    fixReadmeField: function (data) {
      if (!data.readme) {
        fixer.warn('missingReadme')
        data.readme = 'ERROR: No README data found!'
      }
    },
  }
}
