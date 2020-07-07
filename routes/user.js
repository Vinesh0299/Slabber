const express = require('express');
const app = express();
const dbIns = require('../models/dbconnection.js');
const user = require('../models/user.js');
const jwt = require('jsonwebtoken');
const mailer = require('../helpers/mailer.js');
const token = require('../models/tokens.js');
const ObjectId = require('mongodb').ObjectId;

const privatekey = process.env.KEY || "thisisasecret";

// These 2 (lines 8-9) are required to parse url parameters
const urls = require('url');
const querystring = require('querystring');

app.use(express.json());

// Route for user signup
app.post('/login', (req, res, next) => {
    const data = req.body;
    
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Login Verification, if token exists then authentication is done instantaneously
        if(!data.token) {
            Users.find({email: data.email}).toArray().then((item) => {
                if(item.length === 0) res.status(404).json({message: "User Email Not found"});
                else {
                    const newUser = new user(item[0]);
                    if(!newUser.validUserPassword(data.password)){
                        res.status(406).json({message: "Incorrect Password"});
                    } else if(!newUser.isVerified){
                        res.status(401).json({message: "Email not verified"});
                    } else {
                        res.status(200).json({message: "User authenticated", token: jwt.sign({
                            email: data.email
                        }, privatekey), name: item[0].fullname, email: item[0].email});
                    }
                }
            }).catch((err) => {
                console.log(err);
                res.status(500).json({message: 'There was an error while authenticating the user'});
            })
        } else {
            try {
                const decoded = jwt.verify(data.token, privatekey);
                res.status(200).json({message: "User authenticated"});
            } catch(err) {
                res.status(401).json({message: "Token is invalid"});
            }
        }
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

// Route for user signup
app.post('/signup', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Connecting to database to check if someone else has the same email
        Users.find({email: data.email}).toArray().then((item) => {
            if(item.length > 0) res.status(409).json({message: "An account is already registered with this email"});
            else {
                newUser = new user({
                    fullname: data.fullname,
                    gender: data.gender,
                    country: data.country,
                    email: data.email
                });
                // Hashing the user password
                newUser.password = newUser.encryptPassword(data.password);
                Users.insertOne(newUser).then((result) => {
                    const jwtToken = jwt.sign({
                        email: data.email
                    }, privatekey);
                    const newToken = new token({
                        email: data.email,
                        token: jwtToken
                    });
                    mailer.sendMail(newToken).then((items) => {
                        res.status(200).json({message: "User added successfully to the database"});
                    });
                });
            }
        }).catch((err) => {
            console.log(err);
            res.status(500).json({message: 'An error occured while storing information to database'});
        });
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

// Route for confirming Email
app.get('/confirmation', (req,res,next)=>{
    const parsedUrl = urls.parse(req.url);
    const parsedQs = querystring.parse(parsedUrl.query);
    const user_email = parsedQs.email;
    const token = parsedQs.token;

    if(!token || !user_email) {
        res.status(404).json({message: "User email or token not present"});
    } else {
        // Checking if token is valid
        try {
            const decoded = jwt.verify(token, privatekey);
            if(decoded.email !== user_email) res.status(406).json({message: "Token and email ids are different. Cannot process your request"});
            dbIns.then((db) => {
                const Users = db.collection('Users');
                Users.find({email: user_email}).toArray().then((items) => {
                    if(items.length === 0) res.status(404).json({message: "No such user exists in database"});
                    else {
                        Users.updateOne({email: decoded.email}, { $set: { isVerified: true } }).then((items) => {
                            res.status(200).json({message: "User was successfully Verified"});
                        });
                    }
                }).catch((err) => {
                    console.log(err);
                    res.status(500).json({message: 'There was an error while verifying'});
                });
            }).catch((err) => {
                console.log(err);
                res.status(500).json({message: 'Error occured while connecting to the database'});
            });
        } catch(err) {
            res.status(422).json({message: "Token is invalid"});
        }
    }
});

// Route to resend confirmation mail
app.post('/resend', (req, res, next)=>{
    const data = req.body;

    try {
        const decoded = jwt.verify(data.token, privatekey);
        dbIns.then((db) => {
            const Users = db.collection('Users');
            Users.find({email: decoded.email}).toArray().then((items) => {
                if(items.length === 0) res.status(404).json({message: "User not found in database"});
                else {
                    const newToken = new token({
                        email: decoded.email,
                        token: data.token
                    });
                    mailer.sendMail(newToken).then((items) => {
                        res.status(200).json({message: "Verification email sent"});
                    });
                }
            }).catch((err) => {
                console.log(err);
                res.status(500).json({message: 'There was an error while resending the verification link'});
            });
        });
    } catch(err) {
        res.status(422).json({message: "Token is invalid"});
    }
        
});

// Send friend request
app.post('/sendrequest', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Checking if user exists
        Users.find({email: data.findFriend}).toArray().then((items) => {
            if(items.length === 0) res.status(404).json({message: "Your requested user does not exists, please try again"});
            else {
                Users.updateOne({email: data.email}, { $push: { sentRequest: data.findFriend }}).then((result) => {
                    Users.updateOne({email: data.findFriend}, { $push: {receivedRequest: data.email }}).then((result) => {
                        res.status(200).json({message: "Friend Request Sent Successfully"});
                    });
                });
            }
        });
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

// Endpoing to accept friend request
app.post('/acceptrequest', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        // Checking if user exists
        Users.find({email: data.requestemail}).toArray().then((items) => {
            if(items.length === 0) res.status(404).json({message: "User does not exists"});
            else {
                const reqUserId = items[0]._id;
                const friendsList = items[0].friendsList;
                const friendName = items[0].fullname;
                var alreadyFriend = false;
                Users.find({email: data.email}).toArray().then((items) => {
                    const userId = items[0]._id;
                    // Checking if uers are already friends and if not then adding them as friends
                    friendsList.forEach((friend) => {
                        if(JSON.stringify(friend.oid) === JSON.stringify(userId)) alreadyFriend = true;
                    });
                    if(!alreadyFriend) {
                        Users.updateOne({email: data.requestemail}, { $push: { friendsList: {
                            friendId: {
                                "$ref": 'User',
                                "$id": new ObjectId(userId),
                                "$db": "Slabber"
                            }, friendName: items[0].fullname
                        } } });
                    }
                    alreadyFriend = false;
                    items[0].friendsList.forEach((friend) => {
                        if(JSON.stringify(friend.oid) === JSON.stringify(reqUserId)) alreadyFriend = true;
                    });
                    if(!alreadyFriend) {
                        Users.updateOne({email: data.email}, { $push: { friendsList: {
                            friendId: {
                                "$ref": 'User',
                                "$id": new ObjectId(reqUserId),
                                "$db": "Slabber"
                            }, friendName: friendName
                        } } });
                    }
                }).then((items) => {
                    // Removing requests from both users after successfully adding them as friends
                    Users.updateOne({email: data.email}, { $pull: { receivedRequest: data.requestemail } })
                    .then((items) => {
                        Users.updateOne({email: data.requestemail}, { $pull: { sentRequest: data.email } })
                    });
                }).then((items) => {
                    // Sending response to the user
                    if(alreadyFriend) res.status(200).json({message: "Friend Request already Accepted"});
                    else res.status(200).json({message: "Friend Request already Accepted"});
                });
            }
        });
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

// Api will send the email and fullname of all the friends of the user
app.get('/getfriendlist', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        Users.find({email: data.email}).toArray().then(async (items) => {
            if(items[0].friendsList.length === 0) res.status(200).json({message: "You don't have any friends", friends: []});
            else {
                var friends = [];
                for(var i = 0; i < items[0].friendsList.length; i++) {
                    const friend = await Users.find({_id: items[0].friendsList[i].oid}).toArray();
                    friends[i] = {};
                    friends[i].email = friend[0].email;
                    friends[i].fullname = friend[0].fullname;
                }
                res.status(200).json({message: "Here is a list of your friends", friends: friends});
            }
        });
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

// This api will send info of all the requests sent by the user that are not yet accepted
app.get('/getsentrequests', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        return Users.find({email: data.email}).toArray()
    }).then((item) => {
        res.status(200).json({message: "Here are your sent requests", sentRequests: item[0].sentRequest});
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

// This api endpoint will send all the received requests not yet accepted by the user
app.get('/getreceivedrequests', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Users = db.collection('Users');
        return Users.find({email: data.email}).toArray()
    }).then((item) => {
        res.status(200).json({message: "These are friend requests sent to you", receivedRequests: item[0].receivedRequest});
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

module.exports = app;