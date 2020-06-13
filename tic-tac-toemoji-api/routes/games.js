const express = require('express')
const games = require('../lib/games')
const router = express.Router()
const auth = require('../lib/auth')
const common = require('../lib/common')

router.get('/list', async function (req, res, next) {
  res.json(await games.listAllGames())
})

router.post('/new', async function (req, res, next) {
  try {
    const sessionId = await auth.enforceAuth(req)
    res.json(await games.newGame(sessionId))
  } catch (err) {
    next(err)
  }
})

router.post('/join', async function (req, res, next) {
  try {
    const sessionId = await auth.enforceAuth(req)
    res.json(await games.joinGame(req.body.gameLabel, sessionId))
  } catch (err) {
    next(err)
  }
})

router.post('/play', async function (req, res, next) {
  try {
    const sessionId = await auth.enforceAuth(req)
    const gameLabel = req.body.gameLabel
    const move = req.body.move
    if (!gameLabel) {
      throw new common.PublicError('You must provide a valid gameLabel in order to play a move', 400)
    }

    if ((await common.sqlQuery('SELECT id from games WHERE label = ?', gameLabel)).length === 0) {
      throw new common.PublicError(`Game with ID ${gameLabel} does not exist`)
    }

    if (!move) {
      throw new common.PublicError('You must provide a move in JSON format eg: {"x":"1","y":"1"}')
    }
    res.json(await games.updateGame(gameLabel, sessionId, move))
  } catch (err) {
    next(err)
  }
})

module.exports = router
