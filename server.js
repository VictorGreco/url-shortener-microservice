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

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

const loggerMiddleware = (req, res, next) => {
  console.log(`${req.method} - ${req.url} - ${req.body.url || req.params.short_url}`);

  next();
}

const resJsonError = (res) => res.json({ error: 'invalid url' });
const resJsonSuccessfull = (res, { original_url, short_url }) => res.json({ original_url, short_url });
const resRedirect = (res, location) =>  res.redirect(location);
const getAllShorturl = async() => await Shorturl.find();
const getShorturlByOriginalUrl = async(original_url) => await Shorturl.find({ original_url });
const getShorturlByShortUrl = async(short_url) => await Shorturl.find({ short_url });
const createShorturlAndSave = async (original_url, short_url) => {
  const newShorturl = new Shorturl({ original_url, short_url });

  await newShorturl.save();
};

const saveShorturlIfNotFound = async(original_url) => {
  const shorturlItem = await getShorturlByOriginalUrl(original_url);

  if (shorturlItem.length === 0) {
    const shorturlDocuments = await getAllShorturl();
    
    await createShorturlAndSave(original_url, shorturlDocuments.length + 1)
  }
}

const postShorturlHandler = async (req, res) => {
  const { url } = req.body;

  if (!validUrl.isWebUri(url)) {
    resJsonError(res);

  } else {
    await saveShorturlIfNotFound(url);

    const shorturlItem = await getShorturlByOriginalUrl(url);

    resJsonSuccessfull(res, shorturlItem[0]);
  }
}

const getShorturlByCodeHandler = async (req, res) => {
  const { short_url } = req.params

  if (isNaN(+short_url)) {
    resJsonError(res)

  } else {
    const shorturlItem = await getShorturlByShortUrl(short_url);

    shorturlItem.length === 0 ? resJsonError(res) : resRedirect(res, shorturlItem[0].original_url);
  }
}

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post('/api/shorturl', loggerMiddleware, postShorturlHandler);
app.get('/api/shorturl/:short_url', loggerMiddleware, getShorturlByCodeHandler)

app.get('*', (req, res) => {
  res.status(404).send('Not found');
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
