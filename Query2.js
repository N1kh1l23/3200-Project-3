// Query2.js  –  CS3200 Assignment 6
// ─────────────────────────────────────────────────────────────────
// Sum all favorite_counts across every tweet using a Redis string.
//
// Redis operations used:
//   SET    favoritesSum 0              ← initialise to 0
//   INCRBY favoritesSum <value>        ← add each tweet's favorite_count
//   GET    favoritesSum                ← read final total and print it
//
// Missing / null favorite_count values are treated as 0.
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

  // Step 1 – initialise the sum
  await redis.set('favoritesSum', 0);

  // Step 2 – loop over every tweet and INCRBY its favorite_count
  const allTweets = await tweets.find({}, { projection: { favorite_count: 1 } }).toArray();

  for (const tweet of allTweets) {
    // parse to integer; treat missing, null, or non-numeric as 0
    const fav = Number.isInteger(tweet.favorite_count)
      ? tweet.favorite_count
      : parseInt(tweet.favorite_count, 10) || 0;

    // INCRBY 0 is valid Redis but redundant – always call it so the
    // assignment step is clearly demonstrated
    await redis.incrBy('favoritesSum', fav);
  }

  // Step 3 – GET the final total and print
  const total = await redis.get('favoritesSum');
  console.log(`Total favorite count across all tweets: ${total}`);

  // ── close connections ────────────────────────────────────────────
  await mongo.close();
  await redis.quit();
}

main().catch(err => { console.error(err); process.exit(1); });
