module.exports = function (fixer) {
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
    if (typeof person !== 'string') {
      return person
    }
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

  return {
    fixPeople: function (data) {
      modifyPeople(data, unParsePerson)
      modifyPeople(data, parsePerson)
    },
  }
}
