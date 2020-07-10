const dbIns = require('../models/dbconnection.js');
const chatMessage = require('../models/message.js');
const ObjectId = require('mongodb');

var sockets = {};
var objectids = {};

module.exports = function(io) {

    io.on('connection', (socket) => {

        socket.on('join', (data) => {
            data.room.forEach((room) => {
                socket.join(room);
            });
            if(sockets[data.id] === undefined) {
                sockets[data.id] = {
                    online: true,
                    socet: socket.id
                };
                objectids[socket.id] = data.id;
            } else {
                sockets[data.id].online = true;
                sockets[data.id].socket = socket.id;
                objectids[socket.id] = data.id;
            }
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

        socket.on('disconnect', () => {
            delete sockets[objectids[socket.id]];
            delete objectids[socket.id];
        })
    });
}