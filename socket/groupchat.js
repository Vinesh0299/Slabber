module.exports = function(io) {

    io.on('connection', (socket) => {
        console.log('fuck yeah');

        socket.on('join', (data) => {
            socket.join(data.room);
        });

        socket.on('createMessage', (message) => {
            socket.join(message.room);
            io.to(message.room).emit('newMessage', {
                text: message.text,
                room: message.room,
            });
        });
    });
}