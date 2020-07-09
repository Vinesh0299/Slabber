var sockets = {};

module.exports = function(io) {

    io.on('connection', (socket) => {

        socket.on('join', (data) => {
            if(sockets[socket.id] === undefined) {
                socket.join(data.room);
                sockets[socket.id] = [data.room];
            } else if(sockets[socket.id].indexOf(data.room) === -1) {
                socket.join(data.room);
                sockets[socket.id] = [...sockets[socket.id], data.room];
            }
        });

        socket.on('newChatroom', (message) => {
            message.members.forEach((member) => {
                io.to(member).emit('newChatroom', {
                    name: message.name,
                    id: message.id
                });
            });
        });

        socket.on('createMessage', (message) => {
            io.to(message.room).emit('newMessage', {
                message: message.content,
                room: message.room,
                socket: socket.id
            });
        });

        socket.on('disconnect', () => {
            delete sockets[socket.id];
            console.log(sockets);
        });
    });
}