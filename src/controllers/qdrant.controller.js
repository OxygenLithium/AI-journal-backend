import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

export async function upsertIdeas(embeddings, plaintexts, uuids, journalEntryID) {
    const points = embeddings.map((ebd, idx) => {
        return {
            id: uuids[idx],
            vector: ebd,
            payload: {
                userID: null,
                contextID: null,
                date: null,
                journalEntryID,
                plaintext: plaintexts[idx]
            },
        }
    });

    await qdrant.upsert("entries", { points });

    return uuids;
}

export async function deleteIdeasByEntryID(entryID) {
    console.log(entryID);
    console.log(typeof(entryID));
    await qdrant.delete("entries",
    {
        "filter": {
            "must": [
            {
                "key": "journalEntryID",
                "match": {
                    "value": entryID
                }
            }
            ]
        }
    }
    )
}
