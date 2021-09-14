require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { json, urlencoded } = require('body-parser');


// Basic Configuration
const port = process.env.PORT || 3000;
const VALID_URL_REGEX = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
const PARSED_URLS_STORAGE = [null];
const ERROR_RESPONSE = { error: 'invalid url' };
const ERROR_404_MESSAGE = '404 Not found';

app.use(cors());
app.use(json());
app.use(urlencoded({extended: false}));
app.use('/public', express.static(`${process.cwd()}/public`));

const isValidUrlBodyParameterMiddleware = ({ body: { url } }, res, next) => {
  const isValidBodyUrl = url !== undefined && url !== null && url !== '' && !!url.match(VALID_URL_REGEX);

  if (!isValidBodyUrl) {
    res.json(ERROR_RESPONSE);
  }

  next();
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
    original_url : url, 
    short_url : PARSED_URLS_STORAGE.indexOf(url)
  });
}

const getApiShorturlByShorturlHandler = ({ params: { short_url } }, res) => { res.redirect(PARSED_URLS_STORAGE[+short_url]); }

const getAnyRequestHandler = (req, res) => { res.status(404).send(ERROR_404_MESSAGE); }

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', isValidUrlBodyParameterMiddleware, isAlreadyRegisteredUrlInStorageMiddleware, postApiShorturlHandler);
app.get('/api/shorturl/:short_url', isValidShortUrlParamMiddleware, isValidUrlStoredInStorageMiddleware, getApiShorturlByShorturlHandler)
app.get('*', getAnyRequestHandler)


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
