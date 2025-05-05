require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");

// Connect to Mongo
// URL for when on hotspot: mongodb://OxygenLithium:${process.env.MONGODB_PASSWORD}@ac-8l8ijzj-shard-00-00.tnvmsy7.mongodb.net:27017,ac-8l8ijzj-shard-00-01.tnvmsy7.mongodb.net:27017,ac-8l8ijzj-shard-00-02.tnvmsy7.mongodb.net:27017/?ssl=true&replicaSet=atlas-7iem9x-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0
// URL for when not on hotspot: mongodb+srv://OxygenLithium:${process.env.MONGODB_PASSWORD}@cluster0.tnvmsy7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
const mongo = new MongoClient(`mongodb://OxygenLithium:${process.env.MONGODB_PASSWORD}@ac-8l8ijzj-shard-00-00.tnvmsy7.mongodb.net:27017,ac-8l8ijzj-shard-00-01.tnvmsy7.mongodb.net:27017,ac-8l8ijzj-shard-00-02.tnvmsy7.mongodb.net:27017/?ssl=true&replicaSet=atlas-7iem9x-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0`);
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
    const returnVal = await collection.insertOne(data);

    return await getByObjectID(returnVal.insertedId);
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

async function getByObjectID(id) {
    console.log(id);

    const db = await mongoConnect();
    const collection = db.collection('entries');

    return await collection.findOne(id);
}

async function deleteEntry(id) {
    const db = await mongoConnect();
    const collection = db.collection('entries');

    collection.deleteOne({id: id});
}

exports.insertMongoDB = insert;
exports.loadMore = loadMore;
exports.deleteMongoDB = deleteEntry;
