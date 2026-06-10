var extractDescription = require('../extract_description')

module.exports = {
  fixDescriptionField: function (data) {
    if (data.description && typeof data.description !== 'string') {
      this.warn('nonStringDescription')
      delete data.description
    }
    if (data.readme && !data.description) {
      data.description = extractDescription(data.readme)
    }
    if (data.description === undefined) {
      delete data.description
    }
    if (!data.description) {
      this.warn('missingDescription')
    }
  },
}
