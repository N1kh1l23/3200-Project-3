// Query1.js  –  CS3200 Assignment 6
// ─────────────────────────────────────────────────────────────────
// Count the total number of tweets using a Redis string counter.
//
// Redis operations used:
//   SET  tweetCount 0       ← initialise counter to 0
//   INCR tweetCount         ← called once for every tweet in Mongo
//   GET  tweetCount         ← read final value and print it
// ─────────────────────────────────────────────────────────────────

const { MongoClient } = require('mongodb');
const { createClient } = require('redis');

async function main() {
  // ── MongoDB connection ───────────────────────────────────────────
  const mongo = new MongoClient('mongodb://localhost:27017');
  await mongo.connect();
  const tweets = mongo.db('ieeevisTweets').collection('tweets');

  // ── Redis connection ─────────────────────────────────────────────
  const redis = createClient({ url: 'redis://localhost:6379' });
  await redis.connect();

  // Step 1 – initialise the counter
  await redis.set('tweetCount', 0);

  // Step 2 – loop over every tweet and INCR once per document
  const cursor = tweets.find({}, { projection: { _id: 1 } });
  while (await cursor.hasNext()) {
    await cursor.next();
    await redis.incr('tweetCount');
  }

  // Step 3 – GET the final value and print
  const total = await redis.get('tweetCount');
  console.log(`There were ${total} tweets`);

  // ── close connections ────────────────────────────────────────────
  await mongo.close();
  await redis.quit();
}

main().catch(err => { console.error(err); process.exit(1); });
