var sockets = {};

module.exports = function(io) {

    io.on('connection', (socket) => {
        console.log(sockets);

        socket.on('join', (data) => {
            sockets[socket.id] = 1;
            if(!sockets[socket.id]) socket.join(data.room);
        });

        socket.on('createMessage', (message) => {
            io.to(message.room).emit('newMessage', {
                message: message.content,
                room: message.room,
                socket: socket.id
            });
        });

        socket.on('disconnect', () => {
            sockets[socket.id] = 0;
        });
    });
}