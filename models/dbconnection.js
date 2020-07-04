'user strict';

const MongoClient = require('mongodb').MongoClient;

// Url defined for connecting to the remote database.
const url = 'mongodb+srv://' + process.env.MongoUser + ':' + process.env.MongoPass + '@test-cluster-t8qxz.mongodb.net/test?retryWrites=true&w=majority';

// Function that will return an instance to the 'test' database on the remote mongodb database
function getDb() {
    return MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }).then((client) => {
        return client.db("test");
    });
}

module.exports = getDb();