require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { json, urlencoded } = require('body-parser');
const validUrl = require('valid-url');
const mongoose = require('mongoose');
const { Schema } = mongoose;


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const shorurlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number,
    required: true
  }
})

const Shorturl = mongoose.model('Shorturl', shorurlSchema);

const ERROR_404_MESSAGE = 'Not found';
const PARSED_URLS_STORAGE = [null];

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));


const loggerMiddleware = (req, res, next) => {
  const method = req.method;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const path = req.originalUrl;
  const value = req.body.url || req.params.short_url;

  console.log(`${method} - ${ip} / ${path} - ${value}`);
  next();
}

const validateUrlMiddleware = (req, res, next) => {
  if (!validUrl.isWebUri(req.body.url)) {
      res.status(401).json({ error: 'invalid url' });
  }

  next();
};

const storeUniqueUrlMiddleware = async (req, res, next) => {
  const { url } = req.body;

  const shorturlDocuments = await Shorturl.find();
  const shorturlItem = await Shorturl.find({ original_url: url });

  if (shorturlItem.length === 0) {
      const newShorturl = new Shorturl({ original_url: url, short_url: shorturlDocuments.length + 1 });

      await newShorturl.save();
  }

  next();
}

const validateStoredShorturl = async (req, res, next) => {
  const { short_url } = req.params;
  const shorturlItem = await Shorturl.find({ short_url });

  if (shorturlItem.length === 0) {
    res.json({ error: 'invalid url' });
  }

  next();
}

const postShorturlHandler = async (req, res) => {
  const { url } = req.body;

  const shorturlItem = await Shorturl.find({ original_url: url });

  const { original_url, short_url } = shorturlItem[0];

  res.json({  });
}

const getWildCardHandler = (req, res) => { 
  res.status(404).send(ERROR_404_MESSAGE);
}

const getShorturlByCodeHandler = async(req, res) => {
  const { short_url } = req.params
  const shorturlItem = await Shorturl.find({ short_url });

  res.redirect(shorturlItem[0].original_url);
}

const getRootHandler = (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
}

app.get('/', getRootHandler);


app.post('/api/shorturl', validateUrlMiddleware, storeUniqueUrlMiddleware, postShorturlHandler);
app.get('/api/shorturl/:short_url', validateStoredShorturl, getShorturlByCodeHandler)

app.get('*', getWildCardHandler)

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
