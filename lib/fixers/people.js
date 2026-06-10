var isEmail = str => str.includes('@') && (str.indexOf('@') < str.lastIndexOf('.'))

function modifyPeople (data, fn) {
  if (data.author) {
    data.author = fn(data.author)
  }['maintainers', 'contributors'].forEach(function (set) {
    if (!Array.isArray(data[set])) {
      return
    }
    data[set] = data[set].map(fn)
  })
  return data
}

function unParsePerson (person) {
  if (typeof person === 'string') {
    return person
  }
  var name = person.name || ''
  var u = person.url || person.web
  var wrappedUrl = u ? (' (' + u + ')') : ''
  var e = person.email || person.mail
  var wrappedEmail = e ? (' <' + e + '>') : ''
  return name + wrappedEmail + wrappedUrl
}

function parsePerson (person) {
  /* node:coverage disable */
  // not possible in normal flow
  if (typeof person !== 'string') {
    return person
  }
  /* node:coverage enable */
  var matchedName = person.match(/^([^(<]+)/)
  var matchedUrl = person.match(/\(([^()]+)\)/)
  var matchedEmail = person.match(/<([^<>]+)>/)
  var obj = {}
  if (matchedName && matchedName[0].trim()) {
    obj.name = matchedName[0].trim()
  }
  if (matchedEmail) {
    obj.email = matchedEmail[1]
  }
  if (matchedUrl) {
    obj.url = matchedUrl[1]
  }
  return obj
}

module.exports = {
  fixPeople: function (data) {
    modifyPeople(data, unParsePerson)
    modifyPeople(data, parsePerson)
  },
}
