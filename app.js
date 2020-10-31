const express = require('express');
const app = express();
const path = require('path');
const router = express.Router();

app.set('view engine', 'ejs');
app.use(express.static("public"));

let mcqItem = {
    itemId: "", 
    item: "mcq", 
    question: "What is not my name?", 
    description: "You need to do some randomass shit to solve this question", 
    imgDir: "/assets/random.jpg", 
    options: ["Arhaan", "Anisha", "Shadab", "Sameer"], 
    correct: "Adil", 
    backBtn: true
};

let multiMCQItem = {
    itemId: "", 
    item: "multimcq", 
    question: [
        "What is not my name?", 
        "What is your name?",
        "What is not anybody's name?"
    ],
    description: [
        "You need to do some randomass shit to solve this question", 
        "If you thought the last one was weird, let me introduce you to this lol.",
        "It's impressive you're still scrolling, but you should really get back to other, more serious work."
    ],
    imgDir: [
        "/assets/random.jpg", 
        "",
        "/assets/blue.jpg"
    ],
    options: [
        ["Arhaan", "Anisha", "Shadab", "Sameer"],
        ["Adil", "lidA", "dAli"],
        ["Michael", "Steven", "Jack", "Rebecca", "Jason"]
    ], 
    correct: [
        "Arhaan",
        "dAli",
        "Jason"
    ], 
    backBtn: true
};

let sliderItem = {
    itemId: "", 
    item: "slider", 
    question: "What is my age?", 
    description: "You need to do some more randomass shit to solve this question", 
    imgDir: "/assets/random.jpg", 
    min: 90, 
    max: 100, 
    correct: 96, 
    backBtn: true
}

let writtenItem = {
    itemId: "",
    item: "written", 
    question: "What is number 8?", 
    description: "You need to do the most amount of randomass shit to solve this question", 
    imgDir: "/assets/random.jpg", 
    correct: "idk", 
    backBtn: true
}

let narrativeItem = {
    itemId: "",
    item: "narrative",
    objectType: [
        "title",
        "info",
        "image",
        "info",
        "title",
        "info",
        "image",
        "info"
    ],
    objectDescription: [
        "The Story Begins",
        "Hello everyone! So this is a story of a goofy orange who wanted to be, umm, let's just say not so orange. So he drank blue milk, day in, day out.",
        "/assets/random.jpg",
        "Lo, behold! His wish indeed came true. He was now no longer an orange orange, but instead, a blue orange. However, his insides were still the same old, orange. He hated what he had become, and he could no longer live with it. He finally decided that he wanted to give his life away by burying himself alive...",
        "The Second Generation",
        "Years went by. One would think that the curse of the blue orange ended with his suicide. But sadly, fate would have it another way. From the spot where the blue orange buried himself, grew a large tree, and it bore many oranges that were blue in colour.",
        "/assets/blue.jpg",
        "And thus the curse of the blue orange continued for generations to come..."
    ],
    backBtn: true
};

let startItem = {
    itemId: "",
    item: "start",
    title: "The Weird Escape",
    imgDir: "assets/random.jpg",
    description: "Hello! Welcome to our escape room. The ultimate goal is to solve the puzzles that lie ahead and escape the weird world for good! You and your teammates should join forces to make sure that you solve this course in the minimum amount of time making the least number of mistakes. But most importantly, don't forget to enjoy!",
};

let endItem = {
    itemId: "",
    item: "end",
    title: "Thank You For Playing!",
    imgDir: "",
    description: "We appreciate the time and effort you've given in trying out and successfully completing our escape room. We've logged the time and click details during your playthrough which you can download by clicking on the button below. We would appreciate it if you could mail a copy of the generated log file to ar9fb@virginia.edu, this would help us with further development. Thank you.",
};

router.get('/', function(request, response) {
    /**
     * NOTE: This section renders one of the seven templates for the escape 
     * room. In order to test a specific template, uncomment that particular 
     * line of code while commenting the other elements.
     */ 

    response.render("container", startItem);
    // response.render("container", mcqItem);
    // response.render("container", multiMCQItem);
    // response.render("container", sliderItem);
    // response.render("container", writtenItem);
    // response.render("container", narrativeItem);
    // response.render("container", endItem);
});

app.use('/', router);
app.listen(process.env.port || 8888);

console.log("Running at Port 8888");