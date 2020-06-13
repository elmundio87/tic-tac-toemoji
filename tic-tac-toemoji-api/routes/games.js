const express = require('express')
const games = require('../lib/games')
const router = express.Router()
const auth = require('../lib/auth')

/* GET users listing. */
router.get('/', async function (req, res, next) {
  res.json(await games.listAllGames())
})

router.post('/new', async function (req, res, next) {
  try {
    const sessionId = auth.enforceAuth(req)
    games.newGame(sessionId)
  } catch (err) {
    next(err)
  }
})

router.post('/join', async function (req, res, next) {
  try {
    const sessionId = auth.enforceAuth(req)
    res.json(await games.joinGame(req.body.gameLabel, sessionId))
  } catch (err) {
    next(err)
  }
})

module.exports = router
