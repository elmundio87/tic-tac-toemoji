const CONFIG = require('../config.json')
var mariadb = require('mariadb')

const pool = mariadb.createPool(CONFIG.mariadb)

const validateParameters = (params, body) => {
  params.forEach(param => {
    if (!(param in body)) {
      throw new PublicError(`Mandatory parameters: ${params}`, 400)
    }
  })
}

const sqlQuery = async (query, parameters) => {
  let result

  let conn
  try {
    conn = await pool.getConnection()
    result = await conn.query(query, parameters)
  } finally {
    if (conn) {
      conn.end()
    }
  }

  return result
}

class PublicError extends Error {
  constructor (message, code = 500) {
    super(message)
    this.name = 'PublicError'
    this.code = code
  }
}

module.exports = {
  validateParameters,
  sqlQuery,
  PublicError
}
