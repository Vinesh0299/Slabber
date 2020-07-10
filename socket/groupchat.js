const dbIns = require('../models/dbconnection.js');
const chatMessage = require('../models/message.js');
const ObjectId = require('mongodb');

var sockets = {};

module.exports = function(io) {

    io.on('connection', (socket) => {

        socket.on('join', (data) => {
            socket.join(data.room);
            sockets[data.objectid] = socket.id;
        });

        socket.on('newChatroom', (message) => {
            message.members.forEach((member) => {
                io.to(sockets[member]).emit('newChatroom', {
                    name: message.name,
                    id: message.id
                });
            });
        });

        socket.on('createMessage', (message) => {
            const Message = new chatMessage({
                sender: message.content.sender,
                message: message.content.message,
                name: message.content.name
            });
            dbIns((db) => {
                db.collection('Messages').insertOne(Message).then((result) => {
                    db.collection('Chatrooms').updateOne({_id: message.room}, { $push: { message: {
                        "$ref": 'Messages',
                        "$id": new ObjectId(Message._id),
                        "$db": 'Slabber'
                    } } }).then((result) => {
                        io.to(message.room).emit('newMessage', {
                            message: message.content,
                            room: message.room,
                            socket: socket.id
                        });
                    });
                });
            }).catch((err) => {
                console.log(err);
            });
        });
    });
}