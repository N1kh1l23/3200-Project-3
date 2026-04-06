// Query1.js
// CS3200 Assignment 6
//
// Uses Redis to count the total number of tweets stored in MongoDB.
// Steps:
//   1. SET tweetCount to 0 in Redis
//   2. Read every tweet from MongoDB
//   3. INCR tweetCount once per tweet
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

  // initialise the counter
  await redisClient.set('tweetCount', 0);

  // fetch all tweets and increment the counter once per tweet
  const tweets = await collection.find({}).toArray();
  for (const tweet of tweets) {
    await redisClient.incr('tweetCount');
  }

  // read the final value and print
  const count = await redisClient.get('tweetCount');
  console.log(`There were ${count} tweets`);

  // --- close connections ---
  await mongoClient.close();
  await redisClient.quit();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
