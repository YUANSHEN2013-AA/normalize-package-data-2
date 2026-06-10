module.exports = function (data) {
  if (!data.readme) {
    this.warn('missingReadme')
    data.readme = 'ERROR: No README data found!'
  }
}
