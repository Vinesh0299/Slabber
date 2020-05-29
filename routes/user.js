const express = require('express');
const app = express();
const dbIns = require('../models/dbconnection.js');
const user = require('../models/user.js');
const ObjectId = require('mongodb').ObjectId;

// These 2 (lines 8-9) are required to parse url parameters
const urls = require('url');
const querystring = require('querystring');

app.use(express.json());

// Route for user signup
app.post('/login', (req, res, next) => {
    const data = req.body;
    
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Login Verification.
        Users.find({email: data.email}).toArray((err, item) => {
            if(item.length === 0){
                res.send({"error": 3, "message":"User Email Not found"});
            } else {
                if(!item.validUserPassword(data.password)){
                    res.send({"error": 4, "message":"Incorrect Password"});
                };
                if(!item.isVerified){
                    res.send({"error": 5, "message": "Email not verified"});
                }
                res.send(item);
            }
        });
    });
});

// Route for user signup
app.post('/signup', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Connecting to database to check if someone else has the same email or username
        Users.find({username: data.username}).toArray((err, items) => {
            if(items.length > 0) res.send({"error": 1, "message": "Username is already taken"});
            else {
                Users.find({email: data.email}).toArray((err, items) => {
                    if(items.length > 0) res.send({"error": 2, "message": "An account is already registered with this email"});
                    else {
                        newUser = new user({
                            username: data.username,
                            fullname: data.fullname,
                            gender: data.gender,
                            country: data.country,
                            email: data.email
                        });
                        // Hashing the user password
                        newUser.password = newUser.encryptPassword(data.password);
                        Users.insertOne(newUser, (err, result) => {
                            res.send({"error": 0, "message": "User added successfully to the database"});
                        });
                    }
                });
            }
        });
    });
});

// Url for confirming Email
app.get('/confirmation', (req,res,next)=>{
    let parsedUrl = urls.parse(req.url);
    let parsedQs = querystring.parse(parsedUrl.query);
    let user_email = parsedQs.email;
    let tok = parsedQs.tok;
    /*
        U have email(String), tok(string).
        Search the token collection for the given email
        if tok matches then search for the user in User collection.
        then update the isVerified property of the user to true.

        reference: code to be deleted.
        if(!user_email || !tok){
                req.flash('error', "Missing Auth String Credentials");
                res.redirect('/');
            }
            Token.findOne({email:user_email}, async (err,stored_token)=>{
                if(err){
                    req.flash('error', "Token Expired or unavailable");
                    return res.render('index', {title: 'Slabber | Login', messages: errors, hasErrors: errors.length > 0});
                }
                console.log(stored_token);
                console.log(tok);
                if(stored_token.token === tok){
                    
                    const result = await User.updateOne({email:user_email}, {isVerified: true});
                    req.flash('error', "Email Verified Successfully");
                    const errors = req.flash('errors');
                    return res.render('index', {title: 'Slabber | Login', messages: errors, hasErrors: errors.length > 0});
                } else {
                    req.flash('error', "Parameters Do not Match");
                    const errors = req.flash('error');
                    return res.render('index', {title: 'Slabber | Login', messages: errors, hasErrors: errors.length > 0});
                }
            })
    */
    
});

// route to resend confirmation mail
app.post('/resend', (req, res, next)=>{
    const email = req.body.email;
    /*
    Look in token collection for given email.
    if found call this function 
        var info = mailer.sendMail(the_Token);
    if not found make token as described below, save it. now call the function with newToken.
        
        
        Sample Code for reference.
        Token.findOne({email : user_email}, (err,tok)=>{
            if(err){
                // token epired.
                var newToken = new Token({
                    username: req.body.username,
                    email: req.body.email,
                    token: crypto.randomBytes(16).toString('hex')
                }); 
                token.save((err)=>{
                    var info = mailer.sendMail(req.body.email,newToken);
                    console.log(info);
                });
            } else {
                var info = mailer.sendMail(tok.email,tok.token);
            }
        })    
    */ 
        
});

// Send friend request
app.post('/sendrequest', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Checking if user exists
        Users.find({username: data.findFriend}).toArray((err, items) => {
            if(items.length === 0) res.send({"error": 1, "message": "Your requested user does not exists, please try again"});
            else {
                Users.updateOne({username: data.username}, { $push: { sentRequest: data.findFriend }}, (err, result) => {
                    Users.updateOne({username: data.findFriend}, { $push: {receivedRequest: data.username }}, (err, result) => {
                        res.send({"error": 0, "message": "Friend Request Sent Successfully"});
                    });
                });
            }
        });
    });
});

// Endpoing to accept friend request
app.post('/acceptrequest', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Checking if user exists
        Users.find({username: data.requestUsername}).toArray((err, items) => {
            if(items.length === 0) res.send({"error": 1, "message": "User does not exists"});
            else {
                const reqUserId = items[0]._id;
                const friendsList = items[0].friendsList;
                var alreadyFriend = false;
                Users.find({username: data.username}).toArray()
                .then((items) => {
                    console.log(err);
                    const userId = items[0]._id;
                    // Checking if uers are already friends and if not then adding them as friends
                    friendsList.forEach((friend) => {
                        if(JSON.stringify(friend.oid) === JSON.stringify(userId)) alreadyFriend = true;
                    });
                    if(!alreadyFriend) {
                        Users.updateOne({username: data.requestUsername}, { $push: { friendsList: {
                            "$ref": 'User',
                            "$id": new ObjectId(userId),
                            "$db": "test"
                        } } });
                    }
                    alreadyFriend = false;
                    items[0].friendsList.forEach((friend) => {
                        if(JSON.stringify(friend.oid) === JSON.stringify(reqUserId)) alreadyFriend = true;
                    });
                    if(!alreadyFriend) {
                        Users.updateOne({username: data.username}, { $push: { friendsList: {
                            "$ref": 'User',
                            "$id": new ObjectId(reqUserId),
                            "$db": "test"
                        } } });
                    }
                }).then((items) => {
                    // Removing requests from both users after successfully adding them as friends
                    Users.updateOne({username: data.username}, { $pull: { receivedRequest: data.requestUsername } })
                    .then((items) => {
                        Users.updateOne({username: data.requestUsername}, { $pull: { sentRequest: data.username } })
                    });
                }).then((items) => {
                    // Sending response to the user
                    if(alreadyFriend) res.send({"error": 0, "message": "Friend Request already Accepted"});
                    else res.send({"error": 0, "message": "Friend Request already Accepted"});
                });
            }
        });
    });
});

module.exports = app;