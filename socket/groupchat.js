var sockets = {};

module.exports = function(io) {

    io.on('connection', (socket) => {

        socket.on('join', (data) => {
            if(sockets[data.objectid] === undefined) {
                socket.join(data.room);
                sockets[data.objectid].rooms = [data.room];
                sockets[data.objectid].socket = socket.id;
            } else if(sockets[data.objectid].rooms.indexOf(data.room) === -1) {
                socket.join(data.room);
                sockets[data.objectid].socket = socket.id;
                sockets[data.objectid].rooms = [...sockets[data.objectid].rooms, data.room];
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

        socket.on('disconnect', () => {
            delete sockets[socket.id];
            console.log(sockets);
        });
    });
}