var express = require('express');
var app = express();
var os = require("os");
var path = require('path');

app.use('/', express.static(path.join(__dirname, 'web')))

// Configuration
var port = process.env.PORT || 8080;
var message = process.env.MESSAGE || "Hello world!";


app.get('/api', function (req, res) {
  res.send({
    message: message,
    platform: os.type(),
    release: os.release(),
    hostName: os.hostname()
  });
});

// Set up listener
app.listen(port, function () {
  console.log("Listening on: http://%s:%s", os.hostname(), port);
});