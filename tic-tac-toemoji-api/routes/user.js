var express = require('express')
var router = express.Router()
var basicAuth = require('basic-auth')
var auth = require('../lib/auth')
var common = require('../lib/common')

/* GET users listing. */
router.get('/', async function (req, res, next) {
  const sessionId = req.cookies.session_id
  if (sessionId === undefined) {
    res.status(401)
    res.json({
      error: 'Unauthorized - no session cookie'
    })
  } else {
    const sessionIdExists = await auth.sessionIdExists(sessionId)
    if (!(sessionIdExists)) {
      res.status(401)
      res.json({
        error: 'Unauthorized - invalid session cookie'
      })
    } else {
      const userDetails = await auth.getUserDetails(sessionId)
      res.json(userDetails)
    }
  }
})

/* Login using Basic Auth */
router.post('/login', async function (req, res, next) {
  const credentials = basicAuth(req)

  if (!credentials) {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="example"')
    res.end('Access denied')
  } else {
    const loginSuccess = await auth.validateCredentials(credentials.name, credentials.pass)

    if (!loginSuccess) {
      res.status(401)
      res.json({
        error: 'Unauthorized'
      })
    } else {
      try {
        const sessionId = await auth.createSession(credentials.name)
        res.cookie('session_id', sessionId, { maxAge: 900000, httpOnly: true })
        res.json({
          login_success: loginSuccess,
          session_id: sessionId
        })
      } catch {
        res.status(500)
        res.json('Server Error - Check logs')
      }
    }
  }
})

router.post('/create', async function (req, res, next) {
  const mandatoryParameters = ['username', 'password', 'email']
  const optionalParameters = []

  const parametersAreMissing = !common.validateParameters(mandatoryParameters, req.body)
  if (parametersAreMissing) {
    res.status(400)
    res.json({
      mandatoryParameters: mandatoryParameters,
      optionalParameters: optionalParameters
    })
  } else {
    const username = req.body.username
    const password = req.body.password
    const email = req.body.email

    const result = await auth.createUser(username, password, email)
    res.json(result)
  }
})

router.get('/highscore', async function (req, res, next) {
  res.json([])
})

module.exports = router
