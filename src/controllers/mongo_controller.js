require('dotenv').config();
const { MongoClient } = require("mongodb");

// Connect to Mongo
const mongo = new MongoClient(`mongodb+srv://OxygenLithium:${process.env.MONGODB_PASSWORD}@cluster0.tnvmsy7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
let db;
let cursor;

async function mongoConnect() {
    if (!db) {
      await mongo.connect();
      db = mongo.db('JournalEntries');
      console.log('Connected to MongoDB');
    }
    return db;
}

async function insert(data) {
    const db = await mongoConnect();
    const collection = db.collection('entries');
    await collection.insertOne(data);
}

async function instantiateCursor() {
    if (!cursor) {
        const db = await mongoConnect();
        const collection = db.collection('entries');
        cursor = await collection.find();
    }
    return cursor;
}

async function loadMore() {
    var ret = [];

    const cursor = await instantiateCursor();
    for (var i = 0; i < 10; i++) {
        if (!await cursor.hasNext()) {
            break;
        }
        var item = await cursor.next();
        delete item["_id"];
        ret.push(item);
    }

    return ret;
}

exports.insertMongoDB = insert;
exports.instantiateCursor = instantiateCursor;
exports.loadMore = loadMore;
