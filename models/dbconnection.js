'user strict';

const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb+srv://cse180001061:katewa110023@test-cluster-t8qxz.mongodb.net/test?retryWrites=true&w=majority';

function getDb() {
    return MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }).then((client) => {
        return client.db("test");
    });
}

module.exports = getDb();