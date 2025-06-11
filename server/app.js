const express = require('express');
require('dotenv').config();

var app = express();

const port = process.env.BACKEND_URL_PORT || 4560;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
