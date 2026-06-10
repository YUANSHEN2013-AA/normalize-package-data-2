var hostedGitInfo = require('hosted-git-info')
var depTypes = ['dependencies', 'devDependencies', 'optionalDependencies']

function depObjectify (deps, type, warn) {
  /* node:coverage disable */
  // not possible in normal flow
  if (!deps) {
    return {}
  }
  /* node:coverage enable */
  if (typeof deps === 'string') {
    deps = deps.trim().split(/[\n\r\s\t ,]+/)
  }
  if (!Array.isArray(deps)) {
    return deps
  }
  warn('deprecatedArrayDependencies', type)
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

function objectifyDeps (data, warn) {
  depTypes.forEach(function (type) {
    if (!data[type]) {
      return
    }
    data[type] = depObjectify(data[type], type, warn)
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

module.exports = {
  fixBundleDependenciesField: function (data) {
    var bdd = 'bundledDependencies'
    var bd = 'bundleDependencies'
    if (data[bdd] && !data[bd]) {
      data[bd] = data[bdd]
      delete data[bdd]
    }
    if (data[bd] && !Array.isArray(data[bd])) {
      this.warn('nonArrayBundleDependencies')
      delete data[bd]
    } else if (data[bd]) {
      data[bd] = data[bd].filter(function (filtered) {
        if (!filtered || typeof filtered !== 'string') {
          this.warn('nonStringBundleDependency', filtered)
          return false
        } else {
          if (!data.dependencies) {
            data.dependencies = {}
          }
          if (!Object.prototype.hasOwnProperty.call(data.dependencies, filtered)) {
            this.warn('nonDependencyBundleDependency', filtered)
            data.dependencies[filtered] = '*'
          }
          return true
        }
      }, this)
    }
  },

  fixDependencies: function (data) {
    objectifyDeps(data, this.warn)
    addOptionalDepsToDeps(data, this.warn)
    this.fixBundleDependenciesField(data)

    ;['dependencies', 'devDependencies'].forEach(function (deps) {
      if (!(deps in data)) {
        return
      }
      if (!data[deps] || typeof data[deps] !== 'object') {
        this.warn('nonObjectDependencies', deps)
        delete data[deps]
        return
      }
      Object.keys(data[deps]).forEach(function (d) {
        var r = data[deps][d]
        if (typeof r !== 'string') {
          this.warn('nonStringDependency', d, JSON.stringify(r))
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
