module.exports = function(io) {

    io.on('connection', (socket) => {

        socket.on('join', (data) => {
            socket.join(data.room);
        });

        socket.on('createMessage', (message) => {
            io.to(message.room).emit('newMessage', {
                message: message.content,
                room: message.room,
                socket: socket.id
            });
        });
    });
}