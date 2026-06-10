module.exports = function (fixer) {
  return {
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
  }
}
