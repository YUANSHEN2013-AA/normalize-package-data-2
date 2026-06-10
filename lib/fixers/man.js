module.exports = {
  fixManField: function (data) {
    if (!data.man) {
      return
    }
    if (typeof data.man === 'string') {
      data.man = [data.man]
    }
  },
}
