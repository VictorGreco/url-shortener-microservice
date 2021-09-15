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

const postShorturlHandler = async (req, res) => {
  const { url } = req.body;
  const saveShorturlIfNotFound = async (original_url) => {
    const shorturlDocuments = await Shorturl.find();
    const shorturlItem = await Shorturl.find({ original_url });

    if (shorturlItem.length === 0) {
      const newShorturl = new Shorturl({
        original_url: url,
        short_url: shorturlDocuments.length + 1
      });

      await newShorturl.save();
    }
  }

  if (!validUrl.isWebUri(req.body.url)) {
    res.json({ error: 'invalid url' });

  } else {
    await saveShorturlIfNotFound(url);

    const shorturlItem = await Shorturl.find({ original_url: url });
    const { original_url, short_url } = shorturlItem[0];

    res.json({ original_url, short_url });
  }
}

const getShorturlByCodeHandler = async (req, res) => {
  const { short_url } = req.params

  if (isNaN(+short_url)) {
    res.json({ error: 'invalid url' });

  } else {
    const shorturlItem = await Shorturl.find({ short_url });

    if (shorturlItem.length === 0) {
      res.json({ error: 'invalid url' });

    } else {
      res.redirect(shorturlItem[0].original_url);
    }
  }
}

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});


app.post('/api/shorturl', postShorturlHandler);
app.get('/api/shorturl/:short_url', getShorturlByCodeHandler)

app.get('*', (req, res) => {
  res.status(404).send('Not found');
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
