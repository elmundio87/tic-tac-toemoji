'use strict';
var crypto = require('crypto');

const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
}

const createSalt = (length) => {
  return crypto.randomBytes(Math.ceil(length/2))
                          .toString('hex') /** convert to hexadecimal format */
                          .slice(0,length);   /** return required number of characters */
}

const getSaltedHash = (password, salt) => {
  var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
  hash.update(password);
  var saltedHash = hash.digest('hex');
  return saltedHash
}

const fetchHashAndSalt = async (username) => {

    let sql_query_result;
    let result

    try {
      sql_query_result = await common.sqlQuery("SELECT password_hash, password_salt from users WHERE username = ?", [username]);
    } catch (error) {
      throw error
    }

    if(sql_query_result.length > 0){
      result =  {
        password_hash: sql_query_result[0].password_hash,
        password_salt: sql_query_result[0].password_salt
      }
    } else {
      throw `Username '${username}' is not registered`
    }

    return result;

}

const validateCredentials = async (username, password) => {
  let credentials = await fetchHashAndSalt(username);
  return credentials.password_hash == getSaltedHash(password, credentials.password_salt);
}

const validEmail = (email) => {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

const createUser = async (username, password, email) => {
  let salt = createSalt(255);
  let password_hash = await getSaltedHash(password, salt);

  if(!validEmail(email)){
    throw `${email} is not a valid email address`;
  }

  try{
    await common.sqlQuery("INSERT INTO users (username, email, password_hash, password_salt) VALUES(?,?,?,?)", [username, email, password_hash, salt]);
  } catch (err) {
    throw err;
  }

  return true;

};

const createSession = async (username) => {

  let session_id = await newSessionID();
  console.log(session_id);
  let user_id;
  try{
    user_id = (await common.sqlQuery("SELECT id from users WHERE username = ?", [username]))[0].id;
  } catch (err) {
    throw (err);
  }

  try {
    await common.sqlQuery("INSERT INTO user_sessions (session_id, user_id) VALUES(?,?)", [session_id, user_id]);
  } catch (err) {
    throw(err);
  }

  return session_id;

};


const getUserIdForSessionId = async (session_id) => {

  let result;

  try {
    let sql_result = await common.sqlQuery("SELECT * FROM user_sessions WHERE session_id = ?", [session_id]);
    if(sql_result.length > 0){
      result = sql_result[0].user_id
    } else {
      return null
    }
  } catch (err) {
    throw err;
  }
  return result;

}

const getUserDetails = async (session_id) => {

  let result;

  try {
    let user_id = await getUserIdForSessionId(session_id);
    let sql_result = await common.sqlQuery("SELECT username,email,record FROM users WHERE id = ?", [user_id]);
    result = sql_result[0];
  } catch (err) {
    throw err;
  }

  return result;

}

const sessionIdExists = async (session_id) =>{

  let result;

  try {
    let sql_result = await common.sqlQuery("SELECT * FROM user_sessions WHERE session_id = ?", [session_id]);
    result = (sql_result.length > 0);
  } catch (err) {
    throw err;
  }
  return result;

}

const newSessionID = async() => {
  const INT_MAX=2147483647;

  let session_id;
  let i = 0;
  while (i <= 100) {

    session_id = getRandomInt(INT_MAX);
    console.log(session_id);
    if (await getUserIdForSessionId(session_id) === null) {
        break;
    }
    i++;
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