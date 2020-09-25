const path = require('path')
const express = require('express')
const bodyParser = require('body-parser');
const expressServer = express()
const router = require('./router')

module.exports = server = {
  url: 'http://localhost',
  port: 3000,
  start: function( windowStart ) {

	/**
	* From where to serve static files such as images, scripts,...
	*/
	expressServer.use('/', express.static(path.join(__dirname, 'public')))

	/**
	* Extracting POST Data (application/json, application/octet-stream, ... )
	*/
	expressServer.use(bodyParser.urlencoded({ extended: true }));
	expressServer.use(bodyParser.json());
	expressServer.use(bodyParser.raw());

	/**
	* Register Routes
	*/
	expressServer.use('/', router)

	/**
	* Catch 404 and forward to error handler
	*/
	expressServer.use(function(request, response, next) {
	  var error = new Error('Not Found');
	  error.status = 404;
	  next(error);
	});

	/**
	* Handle Errors
	*/
	expressServer.use(function(error, request, response, next) {
	  response.status(error.status || 500);
	  response.json({
		'message': error.message || '',
		'error': error
	  });
	});

	/*
	* Start Server
	*/
	expressServer.listen(this.port, function() {
	  // CallBack to start electron window once server is running, pass a reference to express server
	  windowStart( this );
	});
  }
}
