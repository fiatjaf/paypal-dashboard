const fetch = window.fetch
const btoa = window.btoa
const localsync = require('localsync').default
const Emitter = require('tiny-emitter')

const log = require('./log')

const loggedEmitter = new Emitter()
const loggedSync = localsync('logged', x => x, (val, old, url) => {
  if (val !== old) {
    log.debug(`another tab at ${url} has changed logged state from ${old} to ${val}.`)
    loggedEmitter.emit('logged', val)
  }
})
setTimeout(() => { loggedSync.start(false) }, 1)

module.exports.isLive = function isLive () {
  let live = localStorage.getItem('live')
  if (!live) return false
  return JSON.parse(live)
}

module.exports.toggleLive = function toggleLive () {
  localStorage.setItem('live', !module.exports.isLive())

  let credentials = module.exports.getCredentials()
  loggedSync.trigger(!!credentials)
  loggedEmitter.emit('logged', !!credentials)
}

module.exports.setCredentials = function setCredentials (clientId, secret) {
  let bearer = btoa(clientId + ':' + secret)

  if (bearer !== module.exports.getCredentials()) {
    localStorage.setItem(`credentials-${module.exports.isLive() ? 'live' : 'sandbox'}`, bearer)
    loggedSync.trigger(!!bearer)
    loggedEmitter.emit('logged', !!bearer)
  }
}

module.exports.removeCredentials = function removeCredentials () {
  localStorage.removeItem(`credentials-${module.exports.isLive() ? 'live' : 'sandbox'}`)
  loggedSync.trigger(false)
  loggedEmitter.emit('logged', false)
}

module.exports.getCredentials = function getCredentials () {
  try {
    return localStorage.getItem(`credentials-${module.exports.isLive() ? 'live' : 'sandbox'}`)
  } catch (e) {
    return null
  }
}
module.exports.onLoggedStateChange = function onLoggedStateChange (cb) {
  cb(!!module.exports.getCredentials())
  loggedEmitter.on('logged', cb)
}

module.exports.paypal = function (path, token, method, body) {
  let authentication = token
    ? 'Bearer ' + token
    : 'Basic ' + module.exports.getCredentials()

  return fetch(`https://api${module.exports.isLive() ? '' : '.sandbox'}.paypal.com${path}`, {
    method,
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': authentication
    },
    body
  })
  .then(r => r.json())
}
