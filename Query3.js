// Query3.js
// CS3200 Assignment 6
//
// Counts the number of distinct users in the tweet dataset using a Redis Set.
// Steps:
//   1. Read every tweet from MongoDB
//   2. SADD each tweet's user.screen_name to the Redis set "screen_names"
//      (duplicate values are automatically ignored by a Set)
//   3. SCARD to get the number of unique members and print it

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

  // clear any leftover data from a previous run
  await redisClient.del('screen_names');

  // fetch all tweets and add each user's screen_name to the set
  const tweets = await collection.find({}).toArray();
  for (const tweet of tweets) {
    const screenName = tweet.user && tweet.user.screen_name;
    if (screenName) {
      await redisClient.sAdd('screen_names', screenName);
    }
  }

  // SCARD returns the number of unique members in the set
  const distinctUsers = await redisClient.sCard('screen_names');
  console.log(`Number of distinct users: ${distinctUsers}`);

  // --- close connections ---
  await mongoClient.close();
  await redisClient.quit();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
