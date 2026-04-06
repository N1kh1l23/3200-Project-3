// Query4.js
// CS3200 Assignment 6
//
// Builds a leaderboard of the top 10 users by tweet count using a Redis Sorted Set.
// Steps:
//   1. Read every tweet from MongoDB
//   2. ZINCRBY "leaderboard" 1 <screen_name> for each tweet
//      (the sorted set score tracks each user's tweet count)
//   3. ZRANGE with REV:true to get the top 10 users in descending order
//   4. Print the ranked list

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
  await redisClient.del('leaderboard');

  // fetch all tweets and increment each user's score in the sorted set
  const tweets = await collection.find({}).toArray();
  for (const tweet of tweets) {
    const screenName = tweet.user && tweet.user.screen_name;
    if (screenName) {
      await redisClient.zIncrBy('leaderboard', 1, screenName);
    }
  }

  // get the top 10 users (highest scores first) with their scores
  const top10 = await redisClient.zRangeWithScores('leaderboard', 0, 9, { REV: true });

  console.log('Top 10 users by tweet count:');
  top10.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.value} — ${entry.score} tweets`);
  });

  // --- close connections ---
  await mongoClient.close();
  await redisClient.quit();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
