var isEmail = str => str.includes('@') && (str.indexOf('@') < str.lastIndexOf('.'))

module.exports = {
  isEmail,
}
