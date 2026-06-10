module.exports = function (fixer) {
  return {
    fixKeywordsField: function (data) {
      if (typeof data.keywords === 'string') {
        data.keywords = data.keywords.split(/,\s+/)
      }
      if (data.keywords && !Array.isArray(data.keywords)) {
        delete data.keywords
        fixer.warn('nonArrayKeywords')
      } else if (data.keywords) {
        data.keywords = data.keywords.filter(function (kw) {
          if (typeof kw !== 'string' || !kw) {
            fixer.warn('nonStringKeyword')
            return false
          } else {
            return true
          }
        }, this)
      }
    },
  }
}
