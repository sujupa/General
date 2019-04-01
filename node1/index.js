/*
*Primary file for the API
*
*/
//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs'); //File System Module to read SSL certificates

//Instantiate the Http server
var httpServer = http.createServer(function(req, res){ //here it responds and this function is responsible for any request that is made to localhost:3000
  unifiedServer(req, res);
});


//Start the server
httpServer.listen(config.httpPort,function(){ //here it requests
  console.log("The server is listening on port "+config.httpPort+" in "+config.envName+" mode.");
});

//Instantiate the Https server
var httpServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
};

var httpsServer = https.createServer(httpServerOptions,function(req, res){ //here it responds and this function is responsible for any request that is made to localhost:3000
  unifiedServer(req, res);
});

//Start the server
httpsServer.listen(config.httpsPort,function(){ //here it requests
  console.log("The server is listening on port "+config.httpsPort+" in "+config.envName+" mode.");
});


//All the server logic for both the http and https server
var unifiedServer = function(req, res){

  //Get the URL and parse it
  var parsedUrl = url.parse(req.url, true);

  //Get the path
  var path = parsedUrl.pathname;//pathname is untrimmed
  var trimmedPath = path.replace(/^\/+|\/+$/g, '')

  //Get the query string as an object
  var queryStringObject = parsedUrl.query;


  //Get the HTTP method
  var method = req.method.toLowerCase(); //GET/POST/HEAD/DELETE Method

  //Get the headers as an object
  var headers = req.headers;

  //Get the payload, if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data',function(data){
    buffer += decoder.write(data); //we are appending the decoded utf-8 string into buffer.
  });

  req.on('end',function(){ //here we are ending the decoding
  buffer += decoder.end();

  //Choose the handler this request should go to. If one is notFound handler
  var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

  //Construct the data object to send to the handler
  var data = {
    'trimmedPath' : trimmedPath,
    'queryStringObject' : queryStringObject,
    'method': method,
    'headers' : headers,
    'payload' : buffer
  };

  //Route the request to the handler specified in the router
  chosenHandler(data, function(statusCode, payload){

  //Use the status code called back by the handler, or default to 200
  statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

  //Use the payload called back by the handler, or default to an empty object
  payload = typeof(payload) == 'object' ? payload : {};

  //Convert the payload to a string
  var payloadString = JSON.stringify(payload);

  //Return the response
  res.setHeader('Content-Type','application/json');
  res.writeHead(statusCode);
  res.end(payloadString);

  //Log the request path
  //console.log('Request received on path: ' +trimmedPath+ ' :with method: ' +method+ ' :and with these query string parameters:',queryStringObject);
  //console.log('Request received with these headers:\n', headers);
  console.log('Returning this response: ', statusCode, payloadString);

  });
});
};

//Define the handlers
var handlers = {};

//Ping handler
handlers.ping = function(data, callback){
  callback(200);
}

//Not found handler
handlers.notFound = function(data, callback){
callback(404);
};

//Define a request router
var router = {
  'ping' : handlers.ping   //sample here is nothing but path like: localhost:3000/sample
};
