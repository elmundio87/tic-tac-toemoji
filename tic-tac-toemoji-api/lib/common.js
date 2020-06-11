const validateParameters =  (params, body) => {
  let result = true;
  params.forEach(param => {
    if(!(param in body)){
      result = false;
    }
  });
  return result;
}

const sqlQuery = async (query, parameters) => {
  let result;

  const pool = mariadb.createPool(CONFIG.mariadb);
  let conn;
  try {
    conn = await pool.getConnection();
    result = await conn.query(query, parameters);
  } catch (err) {
    throw err;
  } finally {
    if (conn){
      conn.end();
    }
  }

  return result;
}

module.exports = {
  validateParameters,
  sqlQuery
}