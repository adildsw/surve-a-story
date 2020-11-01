const express = require('express');
const app = express();
const fs = require('fs');
const router = express.Router();
const bodyParser = require('body-parser');
const converter = require('convert-array-to-csv');

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));

let storyRaw = fs.readFileSync("story.json");
let story = JSON.parse(storyRaw); // Stores story data
let storyIdx = 0; // Stores story progress

let incorrect = false; // Dictates whether incorrect-input error message should be displayed
let errorMsg = "The choice(s) you made in the previous puzzle is/are incorrect. How about you try again?"; // Message to be displayed upon incorrect-input

// Stores playthrough time related information
let startTime;
let currentTime;
let endTime;
let timeElapsed;

// For collecting playthrough related stats
let incorrectAttempts = 0;
let logHeader = ["Time Elapsed", "Item Code", "Response", "Correct?"];
let logs = [];
let logsCSV;

// This route displays the story content
router.get('/', function(request, response) {
    if (!incorrect) { 
        var itemCodeToLoad = story["sequence"][storyIdx];
        if (story[itemCodeToLoad]["item"] == "end") {
            story[itemCodeToLoad]["timeTaken"] = Math.round(timeElapsed/1000);
            story[itemCodeToLoad]["incorrectAttempts"] = incorrectAttempts;
        }
        response.render("container", story[itemCodeToLoad]);
    }
    else {
        response.render("incorrect", {errorMsg: errorMsg});
    } 
});

// This route validates the puzzle input and proceeds accordingly
router.post('/next', function(request, response) {
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
            errorMsg = "You must surely have a name! How about you enter your name and try again?";
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
        errorMsg = "The choice(s) you made in the previous puzzle is/are incorrect. How about you try again?";
    }

    // Capturing playthrough logs
    currentTime = new Date();
    timeElapsed = currentTime - startTime;
    if (isNaN(timeElapsed)) {
        timeElapsed = 0;
    }
    if (typeof(selection) == "object") {
        selection = selection.join("|");
    }
    logs.push([timeElapsed, itemCode, selection, passed]);

    // Proceeding story if answer is correct, otherwise displaying error message
    if (passed) {
        storyIdx++; // Progressing story

        // Starting/stopping playthrough timer
        if (item == "start") {
            startTime = new Date();
        }
        else if (story[story["sequence"][storyIdx]]["item"] == "end" ) {
            endTime = new Date();
            timeElapsed = endTime - startTime;
            logs.push([timeElapsed, story[story["sequence"][storyIdx]]["itemCode"], "", passed]);
            
            

        }
    } 
    else {
        incorrect = true; // Enabling incorrect-input form

        // Increasing incorrect-input count if playthrough has begun
        if (item != "start") {
            incorrectAttempts++;
        }
    }

    // Redirecting to story-progression/incorrect-input page
    response.redirect("/");
});

// This route allows returning to the previous story segment
router.post('/back', function(request, response) {
    storyIdx--; // Reverting to previous story segment

    // Capturing playthrough logs for back navigation
    currentTime = new Date();
    timeElapsed = currentTime - startTime;
    logs.push([timeElapsed, "BACK", "", true]);

    response.redirect("/");
});

// This route allows downloading the playthrough logs
router.post('/download', function(request, response) {
    logsCSV = converter.convertArrayToCSV(logs, {header: logHeader, separator: ","});
    response.setHeader('Content-disposition', 'attachment; filename=playthrough-log.csv');
    response.set('Content-type', 'text/csv');
    response.status(200).send(logsCSV);
});

// This route disables the incorrect-input error mode
router.get('/retry', function(request, response) {
    incorrect = false;
    response.redirect("/");
});

// This route resets progress
router.get('/reset', function(request, response) {
    storyIdx = 0;
    startTime = undefined;
    endTime = undefined;
    timeElapsed = undefined;
    logs = [];
    incorrectAttempts = 0;
    response.redirect("/");
})

app.use('/', router);
app.listen(process.env.port || 8888);

console.log("Running at Port 8888");