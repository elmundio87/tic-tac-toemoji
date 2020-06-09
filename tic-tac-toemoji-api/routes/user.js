var express = require('express');
var router = express.Router();
var auth = require('../lib/auth')

/* GET users listing. */
router.get('/', async function(req, res, next) {
  var cookie = req.cookies.session_id;
  let session_id = req.cookies.session_id
  if (session_id === undefined) {
    res.status(401);
    res.json({"error": "Unauthorized"});
  } else {
    console.log()
    let sessionIdExists = await auth.sessionIdExists(session_id)
    if(!(sessionIdExists.result)){
      res.status(401);
      res.json({"error": "Unauthorized"});
    } else {
      let user_details = await auth.getUserDetails(session_id);
      res.json(user_details);
    }
  }
});

module.exports = router;
