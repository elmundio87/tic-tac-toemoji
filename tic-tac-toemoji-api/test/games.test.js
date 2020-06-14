const assert = require('assert')
const games = require('../lib/games')

describe('Test winner (horizontal1-player1)', () => {
  const board = [
    [1, 1, 1],
    [0, 0, 0],
    [0, 0, 0]
  ]
  it('should return player1', () => {
    assert.equal(games.checkWinner(board), 'player1')
  })
})

describe('Test winner (horizontal2-player1)', () => {
  const board = [
    [2, 0, 0],
    [1, 1, 1],
    [0, 0, 2]
  ]
  it('should return player1', () => {
    assert.equal(games.checkWinner(board), 'player1')
  })
})

describe('Test winner (horizontal2-player1)', () => {
  const board = [
    [2, 0, 0],
    [0, 0, 2],
    [1, 1, 1]
  ]
  it('should return player1', () => {
    assert.equal(games.checkWinner(board), 'player1')
  })
})

describe('Test winner (vertical1-player2)', () => {
  const board = [
    [2, 0, 0],
    [2, 0, 1],
    [2, 1, 1]
  ]
  it('should return player2', () => {
    assert.equal(games.checkWinner(board), 'player2')
  })
})

describe('Test winner (vertical2-player2)', () => {
  const board = [
    [0, 2, 0],
    [0, 2, 1],
    [1, 2, 1]
  ]
  it('should return player2', () => {
    assert.equal(games.checkWinner(board), 'player2')
  })
})

describe('Test winner (vertical3-player2)', () => {
  const board = [
    [0, 0, 2],
    [0, 1, 2],
    [1, 1, 2]
  ]
  it('should return player2', () => {
    assert.equal(games.checkWinner(board), 'player2')
  })
})


describe('Test winner (diag1-player2)', () => {
  const board = [
    [2, 1, 1],
    [0, 2, 0],
    [1, 0, 2]]
  it('should return player2', () => {
    assert.equal(games.checkWinner(board), 'player2')
  })
})

describe('Test winner (diag2-player2)', () => {
  const board = [
    [1, 1, 2],
    [0, 2, 0],
    [2, 0, 1]]
  it('should return player2', () => {
    assert.equal(games.checkWinner(board), 'player2')
  })
})

describe('Test draw', () => {
  const board = [
    [1, 2, 1],
    [1, 1, 2],
    [2, 1, 2]
  ]
  it('should return draw', () => {
    assert.equal(games.checkWinner(board), 'draw')
  })
})

describe('Test null', () => {
  const board = [
    [1, 2, 1],
    [1, 1, 2],
    [2, 0, 2]
  ]
  it('should return null', () => {
    assert.equal(games.checkWinner(board), null)
  })
})
