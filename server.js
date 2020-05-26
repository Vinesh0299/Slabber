const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var MongoClient = require('mongodb').MongoClient;

var url = 'mongodb+srv://cse180001061:katewa110023@test-cluster-t8qxz.mongodb.net/test?retryWrites=true&w=majority';
MongoClient.connect(url, (err, db) => {
    if(err) throw err;
    console.log(db);
});

const chatroutes = require('./routes/chats.js');

require('./socket/groupchat.js')(io);

const PORT = 3000 || process.env.PORT;

app.use('/', chatroutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
