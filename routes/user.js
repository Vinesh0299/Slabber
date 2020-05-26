const express = require('express');
const app = express();

app.use(express.json());

app.post('/signup', (req, res, next) => {
    console.log(req.body);
    res.send(req.body);
});

module.exports = app;