const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const chatroutes = require('./routes/chats.js');

require('./socket/groupchat.js')(io);

const PORT = 3000 || process.env.PORT;

app.use(express.static(path.join(__dirname, 'template')));
app.use('/', chatroutes);

/*io.of('/admin').on('connection', (socket) => {
    console.log('fuck! admin is here');
});*/

/*io.on('connection', socket => {
    console.log("a user connected :D");
    io.emit('hemlo', {text: 'hemlo'});
    socket.on('hemlo', socket => {
        console.log(socket.text);
    });
});*/

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
