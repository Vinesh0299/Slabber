const express = require('express');
const app = express();
const dbIns = require('../models/dbconnection.js');
const groups = require('../models/groups.js');
const privateChat = require('../models/privateChat.js');
const ObjectId = require('mongodb').ObjectId;

app.set('view engine', 'ejs');
app.use(express.json());

// Route to handle chatrooms
app.get('/chatroom/:roomid', (req, res, next) => {
    var roomid = req.params.roomid;
    res.render('../views/chatroom.ejs', {room: roomid, roomName: 'Chat Room '+roomid});
});

// Route to handle private chats
app.get('/chat/:chatid', (req, res, next) => {
    var chatid = req.params.chatid;
    res.render('../views/chat.ejs', {chat: chatid, friendName: 'Friend'});
});

// Create a new chatroom
app.post('/createroom', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const Chatrooms = db.collection('Chatrooms');
        const Users = db.collection('Users');
        // Check if email actually exists
        Users.find({email: data.email}).toArray().then((items) => {
            const chatroom = new groups({
                name: data.name
            });
            const adminId = items[0]._id;
            // Insert the created chatroom on to the database
            Chatrooms.insertOne(chatroom)
            .then((items) => {
                Chatrooms.updateOne({_id: chatroom._id}, { $set: { admin: {
                    "$ref": 'User',
                    "$id": new ObjectId(adminId),
                    "$db": 'Slabber'
                } } });
                data.members.map((member) => {
                    Users.find({email: member}).toArray().then((items) => {
                        if(items.length > 0) {
                            // Update the memberList array for the chatroom
                            Chatrooms.updateOne({_id: chatroom._id}, { $push: { memberList: {
                                memberId: {
                                    "$ref": 'User',
                                    "$id": new ObjectId(items[0]._id),
                                    "$db": 'Slabber'
                                },
                                memberName: items[0].fullname
                            } } });
                            // Add this chatroom to each member's chatroom list
                            Users.updateOne({email: items[0].email}, { $push: { chatRoomList: {
                                roomId: {
                                    "$ref": 'Chatroom',
                                    "$id": new ObjectId(chatroom._id),
                                    "$db": 'Slabber'
                                },
                                roomName: data.name
                            } } });
                        }
                    }).then((items) => {
                        res.status(200).json({message: 'Chatroom created successfully'});
                    });
                });
            }).catch((err) => {
                console.log(err);
                res.status(500).json({message: 'Error occured while creating the chatroom'});
            });
        });
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

// Create a new private chat
app.post('/createPrivateChat', (req, res, next) => {
    const data = req.body;
    dbIns.then((db) => {
        const privateChats = db.collection('PrivateChats');
        const Users = db.collection('Users');
        // Getting ids of both users and checking if both of them exists
        Users.find({ $or: [ {email: data.email}, {email: data.friendemail} ] }).toArray().then((items) => {
            if(items.length > 1) {
                const user = items[0].fullname;
                const friend = items[1].fullname;
                const privatechat = new privateChat();
                privateChats.insertOne(privatechat);
                privateChats.updateOne({_id: privatechat._id}, { $set: {
                    person1: {
                        "$ref": 'User',
                        "$id": items[0]._id,
                        "$db": 'Slabber'
                    },
                    person2: {
                        "$ref": 'User',
                        "$id": items[1]._id,
                        "$db": 'Slabber'
                    }
                } }).then((items) => {
                    // Updating User information by adding the private chat data to their database information
                    Users.update({email: data.email}, { $push: { privateChats: {
                        chatId: {
                            "$ref": 'PrivateChat',
                            "$id": privatechat._id,
                            "$db": 'Slabber'
                        },
                        friendName: friend
                    } } });
                    Users.update({email: data.friendemail}, { $push: { privateChats: {
                        chatId: {
                            "$ref": 'PrivateChat',
                            "$id": privatechat._id,
                            "$db": 'Slabber'
                        },
                        friendName: user
                    } } });
                }).then((items) => {
                    // sending success message
                    res.status(200).json({message: "Private chatroom created, you can now start chatting"});
                });
            // Sending error message if the users does not exist
            } else res.status(404).json({message: "User does not exists"});
        });
    }).catch((err) => {
        console.log(err);
        res.status(500).json({message: 'Error occured while connecting to the database'});
    });
});

module.exports = app;