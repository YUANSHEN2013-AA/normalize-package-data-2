module.exports = function (fixer) {
  return {
    fixFilesField: function (data) {
      var files = data.files
      if (files && !Array.isArray(files)) {
        fixer.warn('nonArrayFiles')
        delete data.files
      } else if (data.files) {
        data.files = data.files.filter(function (file) {
          if (!file || typeof file !== 'string') {
            fixer.warn('invalidFilename', file)
            return false
          } else {
            return true
          }
        }, this)
      }
    },
  }
}
