var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/mongoHomework");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHomework";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes

// A GET route for scraping
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.ign.com/articles").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // console.log(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div.listElmnt ").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // console.log($(element).find("a").text().slice(0, -11)); //this is the title!!
      // console.log($(element).find("a").attr("href")); //this is the link!!
      // console.log($(element).find("p").text().slice(25, -11)); //this is the text!!

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element).find("a").text().slice(0, -11)
      result.link = $(element).find("a").attr("href")
      result.someWords = $(element).find("p").text().slice(25, -11).trim();

      console.log(result) //result is working!

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
  });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({}, function (err, docs) {
    if (err) throw err;
    res.json(docs);
  })
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // TODO
  // ====
  // Adventure.findById(id, function (err, adventure) {});
  // Finish the route so it finds one article using the req.params.id,
  db.Article.findById(req.params.id, function (err, stuff) {
    if (err) throw err;
    console.log(stuff);

  })
    // and run the populate method with "note",
    .populate("note").then(function (art) {
      res.json(art);
    })
  // then responds with the article with the note included
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // TODO
  // ====
  db.Note.create(req.body).then(function (dbNote) {
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id } }, { new: true });
  }).then(function (dbArticle) {
    res.json(dbArticle)
  })

  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
