var sockets = {};

module.exports = function(io) {

    io.on('connection', (socket) => {

        socket.on('join', (data) => {
            if(sockets[data.objectid] === undefined) {
                socket.join(data.room);
                sockets[data.objectid].socket = socket.id;
            }
        });

        socket.on('newChatroom', (message) => {
            message.members.forEach((member) => {
                io.to(sockets[member].socket).emit('newChatroom', {
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
    });
}