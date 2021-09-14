require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { json, urlencoded } = require('body-parser');


// Basic Configuration
const port = process.env.PORT || 3000;
const PARSED_URLS_STORAGE = [null];
const ERROR_RESPONSE = { error: 'invalid url' };
const ERROR_404_MESSAGE = 'Not found';

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

const isValidUrlBodyParameterMiddleware = ({ body: { url } }, res, next) => {
  try {
    const isValidBodyUrl = url !== undefined && url !== null && url !== '' && new URL(url);

    if (!isValidBodyUrl) {
      res.json(ERROR_RESPONSE);
    }

    next();
  } catch (err) {
    res.json(ERROR_RESPONSE);
  }
}

const isAlreadyRegisteredUrlInStorageMiddleware = ({ body: { url } }, res, next) => {
  if (!PARSED_URLS_STORAGE.includes(url)) {
    PARSED_URLS_STORAGE.push(url);
  }

  next();
}

const isValidShortUrlParamMiddleware = ({ params: { short_url } }, res, next) => {
  const isValidShortUrlParam = typeof +short_url === 'number' && !isNaN(+short_url) && short_url !== '0' && +short_url !== 0;

  if (!isValidShortUrlParam) {
    res.json(ERROR_RESPONSE);
  }

  next();
}

const isValidUrlStoredInStorageMiddleware = ({ params: { short_url } }, res, next) => {
  const isValidUrlStoredInStorage = PARSED_URLS_STORAGE[+short_url] !== undefined;

  if (!isValidUrlStoredInStorage) {
    res.json(ERROR_RESPONSE);
  }

  next();
}

const postApiShorturlHandler = ({ body: { url } }, res) => {
  res.json({
    original_url: url,
    short_url: PARSED_URLS_STORAGE.indexOf(url)
  });
}

const getApiShorturlByShorturlHandler = ({ params: { short_url } }, res) => { res.redirect(PARSED_URLS_STORAGE[+short_url]); }

const getAnyRequestHandler = (req, res) => { res.status(404).send(ERROR_404_MESSAGE); }

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', isValidUrlBodyParameterMiddleware, isAlreadyRegisteredUrlInStorageMiddleware, postApiShorturlHandler);
app.get('/api/shorturl/:short_url', isValidShortUrlParamMiddleware, isValidUrlStoredInStorageMiddleware, getApiShorturlByShorturlHandler)
app.get('*', getAnyRequestHandler)


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
