require('app-module-path').addPath(__dirname) //dont prefix require with ./

var express = require('express')
var app = express()
var http = require('http').Server(app)
var path = require('path')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var cron = require('node-cron')
var io = require('socket.io')(5050, {
  path: '/socket'
})


if (app.get('env') === 'development'){
  var config = require('./config/config-dev');
} else {
  var config = require('./config/config');
}


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

var crons = require('cronfile')()

app.use(express.static(path.join(__dirname, 'public')))
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')))

var mainRoutes = require('routes/main')();

// app.use('/', mainRoutes);
app.use('/', express.static(path.join(__dirname, 'public')));


var mainSockets = require('sockets')(io)

var server = http.listen(8080, function() {
  console.log('listening on', this.address().port)
})