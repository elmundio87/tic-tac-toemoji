'use strict';
var CONFIG = require('../config.json');
var crypto = require('crypto');
var mariadb = require('mariadb');

const createSalt = (length) => {
  let salt = crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */

  return salt;
}

const getSaltedHash = (password, salt) => {
  var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  var saltedHash = hash.digest('hex');
  return saltedHash
}

const fetchHashAndSalt = async (username) => {
  const pool = mariadb.createPool(CONFIG.mariadb);

    let rows;
    let output = {
      "error": null,
      "result": null
    }

    let conn;
    try {
      conn = await pool.getConnection();
      rows = await conn.query("SELECT password_hash, password_salt from users WHERE username = ?", [username]);
      if(rows.length > 0){
        output.result = {
          password_hash: rows[0].password_hash,
          password_salt: rows[0].password_salt
        }
      } else {
        output.error = `Username '${username}' is not registered`
      }
    } catch (err) {
      output.error = err
    } finally {
    if (conn){
      conn.end();
    }
    return output;
    }

}

const saltedHashMatchesPassword = (password, salted_hash, salt) => {
  let temp_salted_hash
  try{
    temp_salted_hash = getSaltedHash(password, salt)
  } catch (err) {
    return {
      "error": err,
      "result": null
    }
  }
  return {
    "error": null,
    "result": temp_salted_hash == salted_hash
  }
}

const validateCredentials = async (username, password) => {
  let result;
  let credentials = await fetchHashAndSalt(username);
  let output = {
    "error": null,
    "result": false
  }

  if(credentials.error){
    return credentials
  }

  output.result = saltedHashMatchesPassword(password, credentials.result.password_hash, credentials.result.password_salt).result;
  return output;
}

const validEmail = (email) => {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

const createUser = async (username, password, email) => {
  let salt = createSalt(255);
  let password_hash = await getSaltedHash(password, salt);
  let sql_result;
  let error;
  let user_created = false;
  const pool = mariadb.createPool(CONFIG.mariadb);

  let output = {
    "error": null,
    "result": null
  }

  if(!validEmail(email)){
    output.error = `${email} is not a valid email address`
    return output
  }

  let conn;
  try {
    conn = await pool.getConnection();
    sql_result = await conn.query("INSERT INTO users (username, email, password_hash, password_salt) VALUES(?,?,?,?)", [username, email, password_hash, salt]);
    user_created = true;
  } catch (err) {
    error = err;
    output.error = err
  } finally {
  if (conn){
    conn.end();
    output.result = {
      "sql_result": sql_result,
      "user_created": user_created,
    }

    }
    return output;
  }
};

const createSession = async (username) => {

  let error;

  const pool = mariadb.createPool(CONFIG.mariadb);

  let output = {
    "error": null,
    "result": null
  }

  let session_id = await newSessionID();

  let conn;
  try {
    conn = await pool.getConnection();
    let user_id_result = await conn.query("SELECT id FROM users WHERE username = ?", [username]);
    let user_id = user_id_result[0].id;
    await conn.query("INSERT INTO user_sessions (session_id, user_id) VALUES(?,?)", [session_id, user_id]);
  } catch (err) {
    output.error = err
  } finally {
  if (conn){
    conn.end();
    output.result = {
      "session_id": session_id
    }

    }
    return output;
  }
};

const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
}

const getUserIdForSessionId = async (session_id) => {

  let output = {
    "error": null,
    "result": null
  }

  const pool = mariadb.createPool(CONFIG.mariadb);
  let conn;
  try {
    conn = await pool.getConnection();
    let result = await conn.query("SELECT * FROM user_sessions WHERE session_id = ?", [session_id]);
    if(result.length > 0){
      output.result = {"user_id": result[0].user_id}
    }
  } catch (err) {
    error = err;
    output.error = err
  } finally {
  if (conn){
    conn.end();
    }
    return output;
  }
}

const getUserDetails = async (session_id) => {
  let output = {
    "error": null,
    "result": null
  }

  let user_id = (await getUserIdForSessionId(session_id)).result.user_id

  const pool = mariadb.createPool(CONFIG.mariadb);
  let conn;
  try {
    conn = await pool.getConnection();
    let result = await conn.query("SELECT username,email FROM users WHERE id = ?", [user_id]);
    output.result = result[0]
  } catch (err) {
    error = err;
    output.error = err
  } finally {
  if (conn){
    conn.end();
    }
    return output;
  }
}

const sessionIdExists = async (session_id) =>{
  let output = {
    "error": null,
    "result": null
  }

  const pool = mariadb.createPool(CONFIG.mariadb);
  let conn;
  try {
    conn = await pool.getConnection();
    let result = await conn.query("SELECT * FROM user_sessions WHERE session_id = ?", [session_id]);
    output.result = (result.length > 0)
  } catch (err) {
    error = err;
    output.error = err
  } finally {
  if (conn){
    conn.end();
    }
    return output;
  }
}

const newSessionID = async() => {
  let session_id;

  while (true) {
    session_id = getRandomInt(2147483647);
    if (await getUserIdForSessionId(session_id).result == null) {
        break;
    }
  }
  return session_id;

}

module.exports = {
  validateCredentials,
  createUser,
  createSession,
  getUserDetails,
  sessionIdExists
}