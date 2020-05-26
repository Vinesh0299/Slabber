const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Importing created routes
const chatRoutes = require('./routes/chats.js');
const userRoutes = require('./routes/user.js');

// Importing created socket events
require('./socket/groupchat.js')(io);

// Mounting routes on the app
app.use('/', chatRoutes);
app.use('/', userRoutes);

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));