var hostedGitInfo = require('hosted-git-info')

module.exports = function (fixer) {
  return {
    fixRepositoryField: function (data) {
      if (data.repositories) {
        fixer.warn('repositories')
        data.repository = data.repositories[0]
      }
      if (!data.repository) {
        return fixer.warn('missingRepository')
      }
      if (typeof data.repository === 'string') {
        data.repository = {
          type: 'git',
          url: data.repository,
        }
      }
      var r = data.repository.url || ''
      if (r) {
        var hosted = hostedGitInfo.fromUrl(r)
        if (hosted) {
          r = data.repository.url
            = hosted.getDefaultRepresentation() === 'shortcut' ? hosted.https() : hosted.toString()
        }
      }

      if (r.match(/github.com\/[^/]+\/[^/]+\.git\.git$/)) {
        fixer.warn('brokenGitUrl', r)
      }
    },
  }
}
