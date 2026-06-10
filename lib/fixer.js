module.exports = {
  // default warning function
  warn: function () {},

  fixRepositoryField: require('./fixers/repository'),
  fixTypos: require('./fixers/typos'),
  fixScriptsField: require('./fixers/scripts'),
  fixFilesField: require('./fixers/files'),
  fixBinField: require('./fixers/bin'),
  fixManField: require('./fixers/man'),
  fixBundleDependenciesField: require('./fixers/bundle-dependencies'),
  fixDependencies: require('./fixers/dependencies'),
  fixModulesField: require('./fixers/modules'),
  fixKeywordsField: require('./fixers/keywords'),
  fixVersionField: require('./fixers/version'),
  fixPeople: require('./fixers/people'),
  fixNameField: require('./fixers/name'),
  fixDescriptionField: require('./fixers/description'),
  fixReadmeField: require('./fixers/readme'),
  fixBugsField: require('./fixers/bugs'),
  fixHomepageField: require('./fixers/homepage'),
  fixLicenseField: require('./fixers/license'),
}
