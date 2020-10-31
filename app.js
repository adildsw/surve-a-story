const express = require('express');
const app = express();
const fs = require('fs');
const router = express.Router();
const bodyParser = require('body-parser');

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(express.urlencoded({extended: true}));

let storyRaw = fs.readFileSync("story.json");
let story = JSON.parse(storyRaw); // Stores story data
let storyIdx = 5; // Stores story progress

let incorrect = false; // Dictates whether incorrect-input error message should be displayed

// This route displays the story content
router.get('/', function(request, response) {
    if (!incorrect) { 
        var firstItemCode = story["sequence"][storyIdx];
        response.render("container", story[firstItemCode]);
    }
    else {
        response.render("incorrect");
    } 
});

// This route validates the puzzle input and proceeds accordingly
router.post('/next', function(request, response) {
    var itemCode = request.body.itemCode;
    var selection = request.body.selection;
    var item = story[itemCode]["item"];

    // Validating answer
    var passed = false;
    if (item == "start" || item == "end" || item == "narrative") {
        passed = true;
    }
    else {
        var answer = String(story[itemCode]["correct"]);
        passed = JSON.stringify(answer) == JSON.stringify(selection);
    }

    // Proceeding story if answer is correct, otherwise displaying error message
    if (passed) {
        storyIdx++;
    } 
    else {
        incorrect = true;
    }
    response.redirect("/");
});

// This route allows returning to the previous story segment
router.post('/back', function(request, response) {
    storyIdx--;
    response.redirect("/");
});

// This route enables the incorrect-input error mode
router.get('/retry', function(request, response) {
    incorrect = false;
    response.redirect("/");
});

// This route resets progress
router.get('/reset', function(request, response) {
    storyIdx = 0;
    response.redirect("/");
})

app.use('/', router);
app.listen(process.env.port || 8888);

console.log("Running at Port 8888");