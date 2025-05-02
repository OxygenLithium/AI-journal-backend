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

async function retrieve() {
    const db = await mongoConnect();
    const collection = db.collection('entries');
    const rawResp = await collection.find();
    console.log(rawResp);
}

exports.insertMongoDB = insert;
exports.retrieveMongoDB = retrieve;
