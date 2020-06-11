var createError = require('http-errors')
var express = require('express')
var cors = require('cors')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')

var indexRouter = require('./routes/index')
var userRouter = require('./routes/user')
var gamesRouter = require('./routes/games')

var config = require('./config.json')

var app = express()

app.use(cookieParser())
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/user', userRouter)
app.use('/games', gamesRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

app.use(function (err, req, res, next) {
  console.error(err.status)
  if (err.name === 'PublicError') {
    res.status(err.code).send(err.message)
  } else {
    if (config.debug) {
      res.render('error', { message: err.message, status: 500, stack: err.stack })
    } else {
      res.status(500).send('Internal Server Error')
    }
  }
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
