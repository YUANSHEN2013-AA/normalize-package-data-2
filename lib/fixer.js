var repositoryFixers = require('./fixers/repository')
var dependencyFixers = require('./fixers/dependencies')
var fieldFixers = require('./fixers/fields')

var fieldsToFix = ['name', 'version', 'description', 'repository', 'modules', 'scripts',
  'files', 'bin', 'man', 'bugs', 'keywords', 'readme', 'homepage', 'license']
var otherThingsToFix = ['dependencies', 'people', 'typos']

var fixer = Object.assign({
  warn: function () {},
}, fieldFixers, repositoryFixers, dependencyFixers)

fixer.thingsToFix = fieldsToFix.map(function (fieldName) {
  return ucFirst(fieldName) + 'Field'
}).concat(otherThingsToFix)

module.exports = fixer

function ucFirst (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
