require('app-module-path').addPath(__dirname) //dont prefix require with ./

var express = require('express')
var app = express()
var http = require('http').Server(app)
var path = require('path')

if (app.get('env') === 'development'){
  var config = require('./config/config-dev');
} else {
  var config = require('./config/config');
}

app.use(express.static(path.join(__dirname, 'public')))
app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')))

app.use('/', express.static(path.join(__dirname, 'public')));

var server = http.listen(8080, function() {
  console.log('listening on', this.address().port)
})