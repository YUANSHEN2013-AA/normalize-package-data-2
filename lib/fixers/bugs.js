var { URL } = require('node:url')
var hostedGitInfo = require('hosted-git-info')
var typos = require('../typos.json')
var { isEmail } = require('./util')

module.exports = function (fixer) {
  function bugsTypos (bugs) {
    if (!bugs) {
      return
    }
    Object.keys(bugs).forEach(function (k) {
      if (typos.bugs[k]) {
        fixer.warn('typo', k, typos.bugs[k], 'bugs')
        bugs[typos.bugs[k]] = bugs[k]
        delete bugs[k]
      }
    })
  }

  return {
    fixBugsField: function (data) {
      if (!data.bugs && data.repository && data.repository.url) {
        var hosted = hostedGitInfo.fromUrl(data.repository.url)
        if (hosted && hosted.bugs()) {
          data.bugs = { url: hosted.bugs() }
        }
      } else if (data.bugs) {
        if (typeof data.bugs === 'string') {
          if (isEmail(data.bugs)) {
            data.bugs = { email: data.bugs }
          } else if (URL.canParse(data.bugs)) {
            data.bugs = { url: data.bugs }
          } else {
            fixer.warn('nonEmailUrlBugsString')
          }
        } else {
          bugsTypos(data.bugs)
          var oldBugs = data.bugs
          data.bugs = {}
          if (oldBugs.url) {
            if (URL.canParse(oldBugs.url)) {
              data.bugs.url = oldBugs.url
            } else {
              fixer.warn('nonUrlBugsUrlField')
            }
          }
          if (oldBugs.email) {
            if (typeof (oldBugs.email) === 'string' && isEmail(oldBugs.email)) {
              data.bugs.email = oldBugs.email
            } else {
              fixer.warn('nonEmailBugsEmailField')
            }
          }
        }
        if (!data.bugs.email && !data.bugs.url) {
          delete data.bugs
          fixer.warn('emptyNormalizedBugs')
        }
      }
    },
  }
}
