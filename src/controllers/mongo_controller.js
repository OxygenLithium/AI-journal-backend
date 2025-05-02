require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");

// Connect to Mongo
const mongo = new MongoClient(`mongodb+srv://OxygenLithium:${process.env.MONGODB_PASSWORD}@cluster0.tnvmsy7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`);
let db;

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

async function loadMore(lastSeen) {
    const db = await mongoConnect();
    const collection = db.collection('entries');
    var cursor;

    if (lastSeen == -1) {
        cursor = collection.find().sort({ _id: -1 }).limit(10);
    }
    else {
        cursor = collection.find({ _id: { $lt: new ObjectId(lastSeen) } }).sort({ _id: -1 }).limit(10);
    }

    var ret = [];

    while (await cursor.hasNext()) {
        const item = await cursor.next();
        ret.push(item);
    }

    return ret;
}

exports.insertMongoDB = insert;
exports.loadMore = loadMore;
