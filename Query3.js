// Query3.js  –  CS3200 Assignment 6
// ─────────────────────────────────────────────────────────────────
// Count distinct users in the dataset using a Redis Set.
//
// Redis operations used:
//   SADD  screen_names <name>    ← add each user.screen_name
//                                   (Redis Sets ignore duplicates)
//   SCARD screen_names           ← returns the count of unique members
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

  // Clear any data left from a previous run so the count is accurate
  await redis.del('screen_names');

  // Step 1 – read every tweet and SADD the user's screen_name
  const allTweets = await tweets
    .find({}, { projection: { 'user.screen_name': 1 } })
    .toArray();

  for (const tweet of allTweets) {
    const name = tweet.user && tweet.user.screen_name;
    if (name) {
      await redis.sAdd('screen_names', String(name));
    }
  }

  // Step 2 – SCARD gives the number of unique members in the set
  const distinctCount = await redis.sCard('screen_names');
  console.log(`Number of distinct users: ${distinctCount}`);

  // ── close connections ────────────────────────────────────────────
  await mongo.close();
  await redis.quit();
}

main().catch(err => { console.error(err); process.exit(1); });
