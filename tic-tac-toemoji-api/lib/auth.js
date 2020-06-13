'use strict'
var crypto = require('crypto')
var common = require('./common')

const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max))
}

const createSalt = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') /** convert to hexadecimal format */
    .slice(0, length) /** return required number of characters */
}

const getSaltedHash = (password, salt) => {
  var hash = crypto.createHmac('sha512', salt) /** Hashing algorithm sha512 */
  hash.update(password)
  var saltedHash = hash.digest('hex')
  return saltedHash
}

const fetchHashAndSalt = async (username) => {
  let result
  const sqlQueryResult = await common.sqlQuery('SELECT password_hash, password_salt from users WHERE username = ?', [username])

  if (sqlQueryResult.length > 0) {
    result = {
      password_hash: sqlQueryResult[0].password_hash,
      password_salt: sqlQueryResult[0].password_salt
    }
  } else {
    throw new common.PublicError(`Username '${username}' is not registered`, 401)
  }

  return result
}

const validateCredentials = async (username, password) => {
  const credentials = await fetchHashAndSalt(username)
  return credentials.password_hash === getSaltedHash(password, credentials.password_salt)
}

const validEmail = (email) => {
  var re = /\S+@\S+\.\S+/
  return re.test(email)
}

const createUser = async (username, password, email) => {
  const salt = createSalt(255)
  const passwordHash = await getSaltedHash(password, salt)

  if (!validEmail(email)) {
    throw new common.PublicError(`${email} is not a valid email address`)
  }
  if ((await common.sqlQuery('SELECT username FROM users WHERE username = ?', [username])).length > 0) {
    throw new common.PublicError(`A user is already registered with username: ${username}`)
  } else if ((await common.sqlQuery('SELECT email FROM users WHERE email = ?', [email])).length > 0) {
    throw new common.PublicError(`A user is already registered with email: ${email}`)
  } else {
    await common.sqlQuery('INSERT INTO users (username, email, password_hash, password_salt) VALUES(?,?,?,?)', [username, email, passwordHash, salt])
  }

  return { result: 'success' }
}

const createSession = async (username) => {
  const sessionId = await newSessionID()
  const userId = (await common.sqlQuery('SELECT id from users WHERE username = ?', [username]))[0].id
  await common.sqlQuery('INSERT INTO user_sessions (session_id, user_id) VALUES(?,?)', [sessionId, userId])
  return sessionId
}

const getUserIdForSessionId = async (sessionId) => {
  let result
  const sqlResult = await common.sqlQuery('SELECT * FROM user_sessions WHERE session_id = ?', [sessionId])
  if (sqlResult.length > 0) {
    result = sqlResult[0].user_id
  } else {
    return null
  }

  return result
}

const getUserDetails = async (sessionId) => {
  const userId = await getUserIdForSessionId(sessionId)
  const sqlResult = await common.sqlQuery('SELECT username,email,record FROM users WHERE id = ?', [userId])

  return sqlResult[0]
}

const sessionIdExists = async (sessionId) => {
  const sqlResult = await common.sqlQuery('SELECT * FROM user_sessions WHERE session_id = ?', [sessionId])
  return (sqlResult.length > 0)
}

const newSessionID = async () => {
  const maximumAttempts = 100
  const INT_MAX = 2147483647
  const sessionIdList = await common.sqlQuery('SELECT session_id FROM user_sessions')
  let sessionId
  let i = 0
  while (i <= maximumAttempts) {
    sessionId = getRandomInt(INT_MAX)
    if (!(sessionId in sessionIdList)) {
      break
    }
    i++
  }

  if (sessionId === null) {
    throw Error(`Unable to generate a new session ID after ${maximumAttempts} attempts`)
  }

  return sessionId
}

const enforceAuth = async (req) => {
  const sessionId = req.cookies.session_id
  if (sessionId === undefined) {
    throw new common.PublicError('Unauthorized - no session cookie', 401)
  } else {
    if (!(await sessionIdExists(sessionId))) {
      throw new common.PublicError('Unauthorized - invalid session cookie', 401)
    } else {
      return sessionId
    }
  }
}

module.exports = {
  getUserIdForSessionId,
  validateCredentials,
  createUser,
  createSession,
  getUserDetails,
  sessionIdExists,
  enforceAuth
}
