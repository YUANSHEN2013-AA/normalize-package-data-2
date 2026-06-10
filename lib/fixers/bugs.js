var { URL } = require('node:url')
var hostedGitInfo = require('hosted-git-info')
var typos = require('../typos.json')

var isEmail = str => str.includes('@') && (str.indexOf('@') < str.lastIndexOf('.'))

module.exports = {
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
          this.warn('nonEmailUrlBugsString')
        }
      } else {
        bugsTypos(data.bugs, this.warn)
        var oldBugs = data.bugs
        data.bugs = {}
        if (oldBugs.url) {
          if (URL.canParse(oldBugs.url)) {
            data.bugs.url = oldBugs.url
          } else {
            this.warn('nonUrlBugsUrlField')
          }
        }
        if (oldBugs.email) {
          if (typeof (oldBugs.email) === 'string' && isEmail(oldBugs.email)) {
            data.bugs.email = oldBugs.email
          } else {
            this.warn('nonEmailBugsEmailField')
          }
        }
      }
      if (!data.bugs.email && !data.bugs.url) {
        delete data.bugs
        this.warn('emptyNormalizedBugs')
      }
    }
  },
}

function bugsTypos (bugs, warn) {
  if (!bugs) {
    return
  }
  Object.keys(bugs).forEach(function (k) {
    if (typos.bugs[k]) {
      warn('typo', k, typos.bugs[k], 'bugs')
      bugs[typos.bugs[k]] = bugs[k]
      delete bugs[k]
    }
  })
}
