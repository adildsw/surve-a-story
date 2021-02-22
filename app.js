'use strict';
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const converter = require('convert-array-to-csv');
const session = require('express-session');
const config = require('./config');
const path = require('path');
const memstore = require('memorystore')

module.exports = (function(options_args){

  const app = express({strict:true});
  const router = express.Router();
  var MemoryStore = memstore(session);

  const options_default = {
    templateViews: path.join(__dirname, '/views'),
    assets: path.join(__dirname, "public"),
    story: path.join(__dirname, "story.json")
  };
  const options = Object.assign({}, options_default, options_args,);

  app.set('view engine', 'ejs');
  app.set('views', options.templateViews);
  app.use(express.static(options.assets));
  app.use(bodyParser.json());
  app.use(express.urlencoded({extended: true}));
  var sess = {
      cookie: {maxAge: 10800},
      store: new MemoryStore({
          checkPeriod: 10800 // prune expired entries every 24h
      }),
      resave: false,
      secret: config.cookie_secret,
      saveUninitialized: false
  }
  app.use(session(sess))

  let storyRaw = fs.readFileSync(options.story);
  let story = JSON.parse(storyRaw); // Stores story data

  let logHeader = ["Time Elapsed", "Item Code", "Response", "Correct?"];

  // Add base url to all views middleware
  router.use(function(request, response, next){
    response.locals = {
      baseUrl: request.baseUrl + "/"
    }
    next();
  });

  const session_defaults = {
    storyIdx: 0, // Stores story progress
    incorrect: false, // Dictates whether incorrect-input error message should be displayed
    // Stores playthrough time related information
    startTime: undefined,
    timeElapsed: undefined,

    // For collecting playthrough related stats
    incorrectAttempts: 0,
    logs: []
  }

  // setup progression variables if they don't exist
  router.use(function(request, response, next){
      const sess_copy = {...request.session};
      var sess = Object.assign(request.session, session_defaults,sess_copy);
      // Unserealize dates
      sess.startTime = (sess.startTime)?new Date(sess.startTime):undefined;
      sess.timeElapsed = (sess.timeElapsed)?new Date(sess.timeElapsed):undefined;
      next();
  })

  // This route displays the story content
  router.get('/', function(request, response) {
      var sess = request.session;
      var itemCodeToLoad = story["sequence"][sess.storyIdx];
      if (!sess.incorrect) {
          if (story[itemCodeToLoad]["item"] == "end") {
              var minutes = Math.floor(sess.timeElapsed/60000);
              story[itemCodeToLoad]["timeTaken"] = minutes + ":" + Math.round((sess.timeElapsed - minutes*60000)/1000);
              story[itemCodeToLoad]["incorrectAttempts"] = sess.incorrectAttempts;
          }
          response.render("container", story[itemCodeToLoad]);
      }
      else {
          response.render("incorrect", story[itemCodeToLoad]);
      }
  });

  // This route validates the puzzle input and proceeds accordingly
  router.post('/next', function(request, response) {
      var sess = request.session;
      var itemCode = request.body.itemCode;
      var selection = request.body.selection;
      var item = story[itemCode]["item"];

      // Validating answer
      var passed = false;
      if (item == "end" || item == "narrative") {
          passed = true;
      }
      else if (item == "start") {
          if (typeof(selection) == "undefined") {
              passed = false;
          }
          else {
              passed = true;
          }
      }
      else {
          var answer = story[itemCode]["correct"];
          if (typeof(answer) == "number") {
              answer = String(answer);
          }
          passed = JSON.stringify(answer) == JSON.stringify(selection);
      }

      // Capturing playthrough logs
      const currentTime = new Date();
      sess.timeElapsed = currentTime - sess.startTime;
      if (isNaN(sess.timeElapsed)) {
          sess.timeElapsed = 0;
          sess.startTime = new Date();
      }
      if (typeof(selection) == "object") {
          selection = selection.join("|");
      }
      sess.logs.push([sess.timeElapsed, itemCode, selection, passed]);

      // Proceeding story if answer is correct, otherwise displaying error message
      if (passed) {
          sess.storyIdx++; // Progressing story

          // Starting/stopping playthrough timer
          if (item == "start") {
              sess.startTime = new Date();
          }
          else if (story[story["sequence"][sess.storyIdx]]["item"] == "end" ) {
              // TODO: Remove time elapsed calculation here
              const endTime = new Date();
              sess.timeElapsed = endTime - sess.startTime;
              sess.logs.push([sess.timeElapsed, story[story["sequence"][sess.storyIdx]]["itemCode"], "", passed]);
          }
      }
      else {
          sess.incorrect = true; // Enabling incorrect-input form

          // Increasing incorrect-input count if playthrough has begun
          if (item != "start") {
              sess.incorrectAttempts++;
          }
      }

      // Redirecting to story-progression/incorrect-input page
      response.redirect(request.baseUrl);
  });

  // This route allows returning to the previous story segment
  router.post('/back', function(request, response) {
      var sess = request.session;
      sess.storyIdx--; // Reverting to previous story segment

      // Capturing playthrough logs for back navigation
      const currentTime = new Date();
      sess.timeElapsed = currentTime - sess.startTime;
      sess.logs.push([sess.timeElapsed, "BACK", "", true]);

      response.redirect(request.baseUrl);
  });

  // This route allows downloading the playthrough logs
  router.post('/download', function(request, response) {
      const logsCSV = converter.convertArrayToCSV(sess.logs, {header: logHeader, separator: ","});
      response.setHeader('Content-disposition', 'attachment; filename=playthrough-log.csv');
      response.set('Content-type', 'text/csv');
      response.status(200).send(logsCSV);
  });

  // This route disables the incorrect-input error mode
  router.get('/retry', function(request, response) {
      request.session.incorrect = false;
      response.redirect(request.baseUrl);
  });

  // This route resets progress
  router.get('/reset', function(request, response) {
      Object.assign(request.session,session_defaults);
      response.redirect(request.baseUrl);
  })

  app.use('/', router);

  return app;
});
