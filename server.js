const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Importing database connection instance
const getDbIns = require('./models/dbconnection.js');

getDbIns.then((db) => {
    const inventory = db.collection("inventory");
    inventory.insertOne({name: "Madara Uchiha", age: 180})
    .then((result) => {
        inventory.find({}).toArray((err, items) => {
            console.log(items);
        });
    });
});

// Importing created routes
const chatRoutes = require('./routes/chats.js');
const userRoutes = require('./routes/user.js');

// Importing created socket events
require('./socket/groupchat.js')(io);

const PORT = 3000 || process.env.PORT;

// Mounting routes on the app
app.use('/', chatRoutes);
app.use('/', userRoutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
