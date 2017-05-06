var express = require('express');
var router = express.Router();

module.exports = function() {

  router.get('/', function(req, res, next) {
    return res.render('main/index.pug')
  })

  return router

}