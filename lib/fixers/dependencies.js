var hostedGitInfo = require('hosted-git-info')
var depTypes = ['dependencies', 'devDependencies', 'optionalDependencies']

module.exports = function (fixer) {
  function depObjectify (deps, type) {
    if (!deps) {
      return {}
    }
    if (typeof deps === 'string') {
      deps = deps.trim().split(/[\n\r\s\t ,]+/)
    }
    if (!Array.isArray(deps)) {
      return deps
    }
    fixer.warn('deprecatedArrayDependencies', type)
    var o = {}
    deps.filter(function (d) {
      return typeof d === 'string'
    }).forEach(function (d) {
      d = d.trim().split(/(:?[@\s><=])/)
      var dn = d.shift()
      var dv = d.join('')
      dv = dv.trim()
      dv = dv.replace(/^@/, '')
      o[dn] = dv
    })
    return o
  }

  function objectifyDeps (data) {
    depTypes.forEach(function (type) {
      if (!data[type]) {
        return
      }
      data[type] = depObjectify(data[type], type)
    })
  }

  function addOptionalDepsToDeps (data) {
    var o = data.optionalDependencies
    if (!o) {
      return
    }
    var d = data.dependencies || {}
    Object.keys(o).forEach(function (k) {
      d[k] = o[k]
    })
    data.dependencies = d
  }

  return {
    fixDependencies: function (data) {
      objectifyDeps(data)
      addOptionalDepsToDeps(data)
      this.fixBundleDependenciesField(data)

      ;['dependencies', 'devDependencies'].forEach(function (deps) {
        if (!(deps in data)) {
          return
        }
        if (!data[deps] || typeof data[deps] !== 'object') {
          fixer.warn('nonObjectDependencies', deps)
          delete data[deps]
          return
        }
        Object.keys(data[deps]).forEach(function (d) {
          var r = data[deps][d]
          if (typeof r !== 'string') {
            fixer.warn('nonStringDependency', d, JSON.stringify(r))
            delete data[deps][d]
          }
          var hosted = hostedGitInfo.fromUrl(data[deps][d])
          if (hosted) {
            data[deps][d] = hosted.toString()
          }
        }, this)
      }, this)
    },
  }
}
