var express = require('express');
var router = express.Router();
var basic_auth = require('basic-auth')
var auth = require('../lib/auth')
var common = require('../lib/common')

/* GET users listing. */
router.get('/', async function(req, res, next) {
  var cookie = req.cookies.session_id;
  let session_id = req.cookies.session_id
  if (session_id === undefined) {
    res.status(401);
    res.json({"error": "Unauthorized - no session cookie"});
  } else {
    console.log()
    let sessionIdExists = await auth.sessionIdExists(session_id)
    if(!(sessionIdExists)){
      res.status(401);
      res.json({"error": "Unauthorized - invalid session cookie"});
    } else {
      let user_details = await auth.getUserDetails(session_id);
      res.json(user_details);
    }
  }
});

router.post('/login', async function(req, res, next) {

  let credentials = basic_auth(req);

  if (!credentials) {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="example"')
    res.end('Access denied')
  } else {

    let username = credentials.name;
    let password = credentials.pass;
    let login_success = await auth.validateCredentials(username, password);

    if(!login_success){
      res.status(401);
      res.json({
        "error": "Unauthorized"
      })
    } else {
      try{
        let session_id = await auth.createSession(username);
        result = {
          "login_success": login_success,
          "session_id": session_id
        }
        res.cookie('session_id',result.session_id, { maxAge: 900000, httpOnly: true });
        res.json(result);
      } catch {
        res.status(500);
        res.json("Server Error - Check logs");
      }
    }
  }



});

router.post('/create', async function(req, res, next) {
  const mandatoryParameters = ['username','password','email']
  const optionalParameters = []

  parametersAreMissing = ! common.validateParameters(mandatoryParameters, req.body)
  if(parametersAreMissing){
    res.status(400)
    res.json({
      "mandatoryParameters": mandatoryParameters,
      "optionalParameters": optionalParameters
    })
  }else{
    let username = req.body['username'];
    let password = req.body['password'];
    let email = req.body['email'];

    let result = await auth.createUser(username, password, email);
    res.json(result);
  }
});

router.get('/highscore', async function(req, res, next){
  res.json([]);
});

module.exports = router;
