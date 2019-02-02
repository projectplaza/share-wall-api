var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();
var bodyParser = require('body-parser');

// ポート番号
// var port = process.env.PORT || 8080
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.json() );

// tokenと認証
app.use( '/api', require('./routes/login'));
// 以降のAPIはtokenが必要


// app.listen( port );
// console.log( 'server started http://localhost:' + port + '/' );
console.log( 'server started http://localhost:3000/' );

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// URL指定
app.use('/', require('./routes/index'));
// テストAPI
app.use('/api/v1/tests', require('./routes/test'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
