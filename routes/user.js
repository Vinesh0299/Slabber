const express = require('express');
const app = express();
const dbIns = require('../models/dbconnection.js');
const user = require('../models/user.js');

app.use(express.json());

// Route for user signup
app.post('/signup', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        db.collection('Users').find({ $or: [ {username: data.username}, {email: data.email} ]}).toArray((err, items) => {
            if(items.length > 0) res.send({"error": 1, "message": "User already exists"});
            else {
                newUser = new user({
                    username: data.username,
                    fullname: data.fullname,
                    gender: data.gender,
                    country: data.country,
                    email: data.email
                });
                newUser.password = newUser.encryptPassword(data.password);
                db.collection('Users').insertOne(newUser);
                res.send({"error": 0, "message": "User added successfully to the database"});
            }
        });
    });
});

module.exports = app;