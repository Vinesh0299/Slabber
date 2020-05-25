const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.get('/chatroom/:roomid', (req, res, next) => {
    var roomid = req.params.roomid;
    res.render('../views/chatroom.ejs', {room: roomid, roomname: 'Chat Room '+roomid});
});

app.get('/chat/:chatid', (req, res, next) => {
    var chatid = req.params.chatid;
    res.render('../views/chat.ejs', {chat: chatid, friendName: 'Friend'});
});

module.exports = app;