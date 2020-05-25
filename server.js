const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const chatroutes = require('./routes/chats.js');

require('./socket/groupchat.js')(io);

const PORT = 3000 || process.env.PORT;

app.use('/', chatroutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
