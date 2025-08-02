import dotenv from 'dotenv';
import { MongoClient, ObjectId } from "mongodb";

dotenv.config();

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

export async function loadMoreEntries(lastSeen) {
    const db = await mongoConnect();
    const collection = db.collection('entries');
    var cursor;

    if (lastSeen == -1) {
        cursor = await collection.find().sort({ _id: -1 }).limit(10);
    }
    else {
        cursor = await collection.find({ _id: { $lt: new ObjectId(lastSeen) } }).sort({ _id: -1 }).limit(10);
    }

    var ret = [];

    while (await cursor.hasNext()) {
        const item = await cursor.next();
        ret.push(item);
    }

    return ret;
}

async function getByObjectID(id) {
    const db = await mongoConnect();
    const collection = db.collection('entries');

    return await collection.findOne(id);
}

export async function insertEntry(data) {
    const db = await mongoConnect();
    const collection = db.collection('entries');
    const returnVal = await collection.insertOne(data);

    return await getByObjectID(returnVal.insertedId);
}

export async function deleteEntry(id) {
    const db = await mongoConnect();
    const collection = db.collection('entries');

    await collection.deleteOne({_id: new ObjectId(id)});
}

export async function updateEntry(update, ideaIDs, id) {
    const db = await mongoConnect();
    const collection = db.collection('entries');

    await collection.updateOne({_id: new ObjectId(id)}, { $set: { text: update, ideaIDs: ideaIDs } });

    return await getByObjectID(new ObjectId(id));
}
