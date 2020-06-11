const common = require('./common')
const auth = require('./auth')
const randomstring = require('randomstring')

const newGameLabel = async () => {
  const maximumAttempts = 100
  let gameLabel
  let i = 0
  const gameLabelList = await common.sqlQuery('SELECT label FROM games')
  while (i <= maximumAttempts) {
    gameLabel = randomstring.generate(7)
    if (!(gameLabel in gameLabelList)) {
      break
    }
    i++
  }

  if (gameLabel === null) {
    throw Error(`Unable to generate a new game label after ${maximumAttempts} attempts`)
  }

  return gameLabel
}

const listAllGames = async () => {
  const games = await common.sqlQuery('SELECT * from GAMES LIMIT 50')
  return games
}

const newGame = async (sessionId) => {
  const gameLabel = await newGameLabel()
  const player1 = await auth.getUserIdForSessionId(sessionId)
  await common.sqlQuery('INSERT INTO games (label, player1, state) VALUES(?,?,?)', [gameLabel, player1, '{}'])
  return { result: 'success', gameLabel: gameLabel }
}

const joinGame = async (gameLabel, sessionId) => {
  const gameInstance = await common.sqlQuery('SELECT * FROM games WHERE label = ?', [gameLabel])
  const player = await auth.getUserIdForSessionId(sessionId)
  if (gameInstance[0] === null) {
    throw new common.PublicError(`Game with id '${gameLabel}' does not exist`)
  } else if (gameInstance[0].player1 === player) {
    return { result: 'success', player: 'player1' }
  } else if (gameInstance[0].player2 === player) {
    return { result: 'success', player: 'player2' }
  } else if (gameInstance[0].player2 !== null) {
    throw new common.PublicError(`Game with id '${gameLabel}' is full`)
  } else {
    await common.sqlQuery('UPDATE games SET player2 = ? WHERE label = ?', [player, gameLabel])
    return { result: 'success', player: 'player2' }
  }
}

/* Get the current state of the game */
const getGame = async (gameLabel, sessionId) => {

}

/* Validate the new game state and apply it */
const updateGame = async (gameLabel, state, sessionId) => {

}

module.exports = {
  listAllGames,
  newGame,
  joinGame,
  getGame,
  updateGame
}
