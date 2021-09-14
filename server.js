require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { json, urlencoded } = require('body-parser');
const validUrl = require('valid-url');


const ERROR_RESPONSE = { error: 'invalid url' };
const ERROR_404_MESSAGE = 'Not found';
const PARSED_URLS_STORAGE = [null];

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

const validateUrlMiddleware = (req, res, next) => {
  if (!validUrl.isWebUri(req.body.url)) {
      res.json(ERROR_RESPONSE);
  }

  next();
};

const validateStoredShorturl = (req, res, next) => {
  const { short_url } = req.params;
  const isValidUrlStoredInStorage = PARSED_URLS_STORAGE[+short_url] !== undefined;

  if (!isValidUrlStoredInStorage) {
    res.json(ERROR_RESPONSE);
  }

  next();
}

const validateShorturlMiddleware = (req, res, next) => {
  const { short_url } = req.params;
  const isValidShortUrlParam = typeof +short_url === 'number' && !isNaN(+short_url) && short_url !== '0' && +short_url !== 0;

  if (!isValidShortUrlParam) {
      res.json(ERROR_RESPONSE);
  }

  next();
}

const storeUniqueUrlMiddleware = (req, res, next) => {
  const { url } = req.body;

  if (!PARSED_URLS_STORAGE.includes(url)) {
      PARSED_URLS_STORAGE.push(url);
  }

  next();
}

const postShorturlHandler = (req, res) => {
  const { url } = req.body;
  
  res.json({
    original_url: url,
    short_url: PARSED_URLS_STORAGE.indexOf(url)
  });
}

const getWildCardHandler = (req, res) => { 
  res.status(404).send(ERROR_404_MESSAGE);
}

const getShorturlByCodeHandler = (req, res) => { 
  res.redirect(PARSED_URLS_STORAGE[+req.params.short_url]);
}

const getRootHandler = (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
}

app.get('/', getRootHandler);


app.post('/api/shorturl', validateUrlMiddleware, storeUniqueUrlMiddleware, postShorturlHandler);
app.get('/api/shorturl/:short_url', validateShorturlMiddleware, validateStoredShorturl, getShorturlByCodeHandler)

app.get('*', getWildCardHandler)

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
