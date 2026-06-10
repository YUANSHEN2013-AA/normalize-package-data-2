module.exports = function (data) {
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
}
