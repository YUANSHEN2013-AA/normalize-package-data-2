var fixer = {
  warn: function () {},
}

var modules = [
  require('./fixers/repository')(fixer),
  require('./fixers/typos')(fixer),
  require('./fixers/scripts')(fixer),
  require('./fixers/files')(fixer),
  require('./fixers/bin')(fixer),
  require('./fixers/man')(fixer),
  require('./fixers/bundleDependencies')(fixer),
  require('./fixers/dependencies')(fixer),
  require('./fixers/modules')(fixer),
  require('./fixers/keywords')(fixer),
  require('./fixers/version')(fixer),
  require('./fixers/people')(fixer),
  require('./fixers/name')(fixer),
  require('./fixers/description')(fixer),
  require('./fixers/readme')(fixer),
  require('./fixers/bugs')(fixer),
  require('./fixers/homepage')(fixer),
  require('./fixers/license')(fixer),
]

modules.forEach(function (mod) {
  Object.keys(mod).forEach(function (key) {
    fixer[key] = mod[key]
  })
})

module.exports = fixer
