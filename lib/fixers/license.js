var validateLicense = require('validate-npm-package-license')

module.exports = function (fixer) {
  return {
    fixLicenseField: function (data) {
      const license = data.license || data.licence
      if (!license) {
        return fixer.warn('missingLicense')
      }
      if (
        typeof (license) !== 'string' ||
        license.length < 1 ||
        license.trim() === ''
      ) {
        return fixer.warn('invalidLicense')
      }
      if (!validateLicense(license).validForNewPackages) {
        return fixer.warn('invalidLicense')
      }
    },
  }
}
