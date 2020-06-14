const common = require('./common')
const auth = require('./auth')
const randomstring = require('randomstring')

const playersMap = {
  player1: 1,
  player2: 2
}

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

const getNextPlayer = (player) => {
  if (player === 'player1') {
    return 'player2'
  }
  return 'player1'
}

/* Get the current state of the game */
const getGame = async (gameLabel, sessionId) => {
  const userId = await auth.getUserIdForSessionId(sessionId)
  const game = await common.sqlQuery('SELECT * from games WHERE label = ? AND (player1 = ? OR player2 = ?)', [gameLabel, userId, userId])
  if (game[0].length === 0) {
    throw new common.PublicError('You are not in this game')
  }
  return game[0]
}

/* Validate the new game state and apply it */
const updateGame = async (gameLabel, sessionId, move) => {
  const game = await getGame(gameLabel, sessionId)
  const state = JSON.parse(game.state)
  const turn = state.turn
  const currentPlayer = game[turn]
  const userId = await auth.getUserIdForSessionId(sessionId)
  if (userId === currentPlayer) {
    const board = state.board
    if (board[move.x][move.y] === 0) {
      board[move.x][move.y] = playersMap[turn]
      const newState = {
        turn: getNextPlayer(turn),
        board: board
      }
      await common.sqlQuery('UPDATE games SET state = ? where label = ?', [JSON.stringify(newState), gameLabel])
      return state
    } else {
      throw new common.PublicError('Illegal move - this space is already occupied', 400)
    }
  } else {
    throw new common.PublicError('It is not currently your turn!', 400)
  }
}

const checkSquare = (board, square, player) => {
  return board[square[0]][square[1]] === playersMap[player]
}

const checkCombo = (board, combo, player, winningPlayer) => {
  if (checkSquare(board, combo[0], player) &&
    checkSquare(board, combo[1], player) &&
    checkSquare(board, combo[2], player) &&
    winningPlayer === null) {
    winningPlayer = player
  }
  return winningPlayer
}

const checkWinner = (board) => {
  const winningPlacements = [
    [[0, 0], [0, 1], [0, 2]], // top horizontal
    [[1, 0], [1, 1], [1, 2]], // middle horizontal
    [[2, 0], [2, 1], [2, 2]], // bottom horizontal
    [[0, 0], [1, 0], [2, 0]], // left vertical
    [[0, 1], [1, 1], [2, 1]], // middle vertical
    [[0, 2], [1, 2], [2, 2]], // right vertical
    [[0, 0], [1, 1], [2, 2]], // top/left to bottom/right diagonal
    [[2, 0], [1, 1], [0, 2]] // bottom/left to top/right diagonal
  ]

  let winningPlayer = null

  const playersArr = Object.keys(playersMap)
  playersArr.forEach(player => {
    winningPlacements.forEach(combo => {
      winningPlayer = checkCombo(board, combo, player, winningPlayer)
    })
  })
  if (!(board[0].includes(0) || board[1].includes(0) || board[2].includes(0)) &&
        winningPlayer === null) {
    winningPlayer = 'draw'
  }
  return winningPlayer
}

module.exports = {
  listAllGames,
  newGame,
  joinGame,
  getGame,
  updateGame,
  checkWinner
}
