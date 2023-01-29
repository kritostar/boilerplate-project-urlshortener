'use strict';
var express = require('express');
var mongoose = require('mongoose');
var AutoIncrement = require('mongoose-sequence')(mongoose);
var cors = require('cors');
var app = express();

var port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  _id: Number,
  original_url: String
});
urlSchema.plugin(AutoIncrement, { id: 'short_url_seq', inc_field: '_id' });
const Direccion = mongoose.model('Direccion', urlSchema);
var bodyParser = require('body-parser');

function validURL(str) {
  var regex = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
  if (!regex.test(str)) {
    return false;
  } else {
    return true;
  }
}


app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(cors());
app.use(express.json());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/hello', function(req, res) {
  res.json({ "greeting": "hello API" });
});

app.post("/api/shorturl", function(req, res) {
  const url = req.body.url;
  const stringIsAValidUrl = validURL(url);
  if (!stringIsAValidUrl) {
    res.json({
      error: 'invalid url'
    })
  } else {

    var dir = Direccion.findOne({ original_url: url }, function(err, docs) {
      if (err) return console.log(err)
      if (!docs) {

        var doc1 = new Direccion({ original_url: url });

        doc1.save(function(err, doc) {
          if (err) return console.error(err);
          console.log("Document inserted succussfully! :" + doc);
          res.json({
            original_url: doc.original_url,
            short_url: doc._id
          });
        });
      }

      else {
        res.json({
          original_url: docs.original_url,
          short_url: docs._id
        })
      }
    });
  }
});

app.get('/api/shorturl/:shorturl', function(req, res) {
  Direccion.findOne({
    _id: req.params.shorturl
  }, function(err, docs) {
    if (err) return console.log(err)
    if (!docs) {
      return res.status(404).json('No URL found')
    }
    else {
      return res.redirect(docs.original_url)
    }
  })
});

app.listen(port, function() {
  console.log('Node.js listening ...');
});