var { URL } = require('node:url')
var hostedGitInfo = require('hosted-git-info')

module.exports = function (fixer) {
  return {
    fixHomepageField: function (data) {
      if (!data.homepage && data.repository && data.repository.url) {
        var hosted = hostedGitInfo.fromUrl(data.repository.url)
        if (hosted && hosted.docs()) {
          data.homepage = hosted.docs()
        }
      }
      if (!data.homepage) {
        return
      }

      if (typeof data.homepage !== 'string') {
        fixer.warn('nonUrlHomepage')
        return delete data.homepage
      }
      if (!URL.canParse(data.homepage)) {
        data.homepage = 'http://' + data.homepage
      }
    },
  }
}
