module.exports = {
  fixFilesField: function (data) {
    var files = data.files
    if (files && !Array.isArray(files)) {
      this.warn('nonArrayFiles')
      delete data.files
    } else if (data.files) {
      data.files = data.files.filter(function (file) {
        if (!file || typeof file !== 'string') {
          this.warn('invalidFilename', file)
          return false
        } else {
          return true
        }
      }, this)
    }
  },

  fixBinField: function (data) {
    if (!data.bin) {
      return
    }
    if (typeof data.bin === 'string') {
      var b = {}
      var match
      if (match = data.name.match(/^@[^/]+[/](.*)$/)) {
        b[match[1]] = data.bin
      } else {
        b[data.name] = data.bin
      }
      data.bin = b
    }
  },

  fixManField: function (data) {
    if (!data.man) {
      return
    }
    if (typeof data.man === 'string') {
      data.man = [data.man]
    }
  },
}
