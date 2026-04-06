// Query2.js
// CS3200 Assignment 6
//
// Sums the total favorite_count across all tweets using Redis.
// Steps:
//   1. SET favoritesSum to 0 in Redis
//   2. Read every tweet from MongoDB
//   3. INCRBY favoritesSum by each tweet's favorite_count
//      (missing or null favorite_count is treated as 0)
//   4. GET the final value and print it

const { MongoClient } = require('mongodb');
const { createClient }  = require('redis');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME   = 'ieeevisTweets';
const COL_NAME  = 'tweets';

async function main() {
  // --- connect to MongoDB ---
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const collection = mongoClient.db(DB_NAME).collection(COL_NAME);

  // --- connect to Redis ---
  const redisClient = createClient({ url: 'redis://localhost:6379' });
  await redisClient.connect();

  // initialise the sum
  await redisClient.set('favoritesSum', 0);

  // fetch all tweets and add each tweet's favorite_count
  const tweets = await collection.find({}).toArray();
  for (const tweet of tweets) {
    // treat missing or null favorite_count as 0
    const favCount = parseInt(tweet.favorite_count) || 0;
    if (favCount > 0) {
      await redisClient.incrBy('favoritesSum', favCount);
    }
  }

  // read the final value and print
  const total = await redisClient.get('favoritesSum');
  console.log(`Total favorite count across all tweets: ${total}`);

  // --- close connections ---
  await mongoClient.close();
  await redisClient.quit();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
