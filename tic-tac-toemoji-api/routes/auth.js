var express = require('express');
var auth = require('../lib/auth');
var router = express.Router();

const validateParameters =  (params, body) => {
  let result = true;
  params.forEach(param => {
    if(!(param in body)){
      result = false;
    }
  });
  return result;
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.status(200);
  res.json();
});

router.post('/loginUser', async function(req, res, next) {
  const mandatoryParameters = ['username','password','email']
  const optionalParameters = []


  let username = req.body['username'];
  let password = req.body['password'];

  let login_success = await auth.validateCredentials(username, password);

  console.log(login_success.result)
  if(!login_success.result){
    res.status(401);
    res.json({
      "result": false,
      "error": "Unauthorized"
    })
    return
  } else {
    let session_id = await auth.createSession(username);
    result = {
      "login_success": login_success.result,
      "session_id": session_id.result.session_id
    }
    res.cookie('session_id',result.session_id, { maxAge: 900000, httpOnly: true });
    res.json(result);
  }

});

router.post('/createUser', async function(req, res, next) {
  const mandatoryParameters = ['username','password','email']
  const optionalParameters = []

  parametersAreMissing = ! validateParameters(mandatoryParameters, req.body)
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

module.exports = router;
