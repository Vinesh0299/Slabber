const express = require('express');
const app = express();
const dbIns = require('../models/dbconnection.js');

app.use(express.json());

// Route for user signup
app.post('/signup', (req, res, next) => {
    console.log(req.body);
});

module.exports = app;