const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

var getDbIns = require('./models/dbconnection.js');

getDbIns.then((db) => {
    db.collection("inventory").find({}).toArray((err, items) => {
        console.log(items);
    });
});

/*const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    client.create
    const db = client.db("test");
    const collection = db.collection("inventory");
    collection.find({}).toArray((err, items) => {
        console.log(items);
    });
});
client.close();*/

const chatRoutes = require('./routes/chats.js');
const userRoutes = require('./routes/user.js');

require('./socket/groupchat.js')(io);

const PORT = 3000 || process.env.PORT;

app.use('/', chatRoutes);
app.use('/', userRoutes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
