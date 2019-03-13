// Entry File

// Dependencies
const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require('./config');
const os = require('os')
const cluster = require('cluster')

// Creating HTTP Server
const httpServer = http.createServer((req,res) => {
  unifiedServer(req,res);
})

if(cluster.isMaster){
  for(let i=0;i<os.cpus().length;i++){
    cluster.fork()
  }
} else {
  // Starting HTTP Server on config.port
  httpServer.listen(config.httpPort,() => {
    console.log("Server Started on Port: "+ config.httpPort);
  })
}


// Common Server Logic
var unifiedServer = (req,res) => {

  // Parsing Url
  const parsedUrl = url.parse(req.url, true);

  // Get the Path
  const path = parsedUrl.pathname;

  // Trimmed Path
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the Method
  const method = req.method.toLowerCase();

  // Get the Headers
  const headers = req.headers;

  // Get the Query String as an Object
  const queryStringObject = parsedUrl.query;

  // Get the Payload if any
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", data => {
    buffer += decoder.write(data);
  });

  req.on("end",() => {
    // Successfully Got Paylaod in payload object
    buffer += decoder.end();

    // Path Routing if any or Not Found
    const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Constructing Data Object to Send to handlers
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      'payload' : buffer
    };

    // Routing the Request
    chosenHandler(data, (statusCode, payload) => {
      // Use the Status Code Given by Handler if any or use 200
      statusCode = typeof statusCode === 'number' ? statusCode : 200;

      // Use the Payload if any or instantiate it with empty Object
      payload = typeof payload === 'object' ? payload : {};

      // Convert the Payload to a String
      const payloadString = JSON.stringify(payload);

      // Returning the Respose
      res.setHeader('Content-Type','application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Console Logging the Path & Response Code with payload
      console.log("------------------------------------------")
      console.log("Path: ",trimmedPath);
      console.log("Method: ",method);
      console.log("Status Code: ",statusCode);
      console.log("Payload: ",payloadString);
      console.log("------------------------------------------")
    });

  });

}

// Define All Handlers
let handlers = {};

// Hello handler
handlers.hello = (data, callback) => {
  callback(200,{ msg : "Hello World" });
}

// Not Found Handler
handlers.notFound = function(data, callback){
  callback(404, { msg : "Not Found" })
}

// Define the Request Router
const router  = {
  'hello' : handlers.hello
}
