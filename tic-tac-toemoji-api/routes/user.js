const express = require('express')
const router = express.Router()
const basicAuth = require('basic-auth')
const auth = require('../lib/auth')
const common = require('../lib/common')

/* GET users listing. */
router.get('/', async function (req, res, next) {
  try {
    const sessionId = auth.enforceAuth(req)
    const userDetails = await auth.getUserDetails(sessionId)
    res.json(userDetails)
  } catch (err) {
    next(err)
  }
})

/* Login using Basic Auth */
router.post('/login', async function (req, res, next) {
  const credentials = basicAuth(req)
  try {
    if (!credentials) {
      res.setHeader('WWW-Authenticate', 'Basic realm="example"')
      throw new common.PublicError('Access Denied', 401)
    } else {
      const loginSuccess = await auth.validateCredentials(credentials.name, credentials.pass)

      if (!loginSuccess) {
        throw new common.PublicError('Unauthorized - invalid credentials', 401)
      } else {
        const sessionId = await auth.createSession(credentials.name)
        res.cookie('session_id', sessionId, { maxAge: 900000, httpOnly: true })
        res.json({
          login_success: loginSuccess,
          session_id: sessionId
        })
      }
    }
  } catch (err) {
    next(err)
  }
})

router.post('/create', async function (req, res, next) {
  const mandatoryParameters = ['username', 'password', 'email']
  try {
    common.validateParameters(mandatoryParameters, req.body)
    res.json(await auth.createUser(req.body.username, req.body.password, req.body.email))
  } catch (err) {
    next(err)
  }
})

router.get('/highscore', async function (req, res, next) {
  try {
    res.json(await common.sqlQuery('SELECT username, win FROM users ORDER BY win DESC LIMIT 10'))
  } catch (err) {
    next(err)
  }
})

module.exports = router
