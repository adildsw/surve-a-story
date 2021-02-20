'use strict';
var express = require('express');
var storyApp = require('./app');
const port = process.env.PORT || 8888;
var app = express();
app.use('/', storyApp);
app.listen(port, () => console.log("server listening on "+port));
