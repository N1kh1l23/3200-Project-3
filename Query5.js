// Query5.js
// CS3200 Assignment 6
//
// Stores tweet data in Redis using Lists and Hashes, then demonstrates retrieval.
//
// For every user:
//   Redis List  →  tweets:<screen_name>   containing that user's tweet ids
//
// For every tweet:
//   Redis Hash  →  tweet:<tweet_id>       storing key tweet fields:
//                  id, text, created_at, favorite_count, retweet_count,
//                  screen_name, user_name
//
// At the end, a sample user's tweet ids are fetched from their List and
// a couple of their Hashes are printed to prove the structure works.

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

  // fetch all tweets from MongoDB
  const tweets = await collection.find({}).toArray();
  console.log(`Loaded ${tweets.length} tweets from MongoDB. Storing in Redis...`);

  // keep track of one sample user so we can demonstrate retrieval later
  let sampleUser = null;

  for (const tweet of tweets) {
    const tweetId    = tweet.id_str || String(tweet.id || '');
    const screenName = (tweet.user && tweet.user.screen_name) || 'unknown';
    const userName   = (tweet.user && tweet.user.name)        || 'unknown';

    if (!tweetId) continue; // skip malformed documents

    // --- Redis List: tweets:<screen_name> ---
    // RPUSH appends the tweet id to the user's list
    await redisClient.rPush(`tweets:${screenName}`, tweetId);

    // --- Redis Hash: tweet:<tweet_id> ---
    await redisClient.hSet(`tweet:${tweetId}`, {
      id:             tweetId,
      text:           String(tweet.text           || ''),
      created_at:     String(tweet.created_at     || ''),
      favorite_count: String(tweet.favorite_count != null ? tweet.favorite_count : 0),
      retweet_count:  String(tweet.retweet_count  != null ? tweet.retweet_count  : 0),
      screen_name:    screenName,
      user_name:      userName,
    });

    // save the first user we encounter as the sample
    if (!sampleUser) {
      sampleUser = screenName;
    }
  }

  console.log('Done storing tweets in Redis.\n');

  // --- Demonstrate retrieval ---
  if (sampleUser) {
    console.log(`Sample user: @${sampleUser}`);

    // fetch all tweet ids for the sample user from their Redis List
    const tweetIds = await redisClient.lRange(`tweets:${sampleUser}`, 0, -1);
    console.log(`  Tweet IDs stored (${tweetIds.length} total): ${tweetIds.slice(0, 5).join(', ')}${tweetIds.length > 5 ? ', ...' : ''}`);

    // fetch and print the Hash for the first 2 tweet ids
    console.log('\n  Details for first 2 tweets:');
    for (const tid of tweetIds.slice(0, 2)) {
      const hash = await redisClient.hGetAll(`tweet:${tid}`);
      console.log(`\n  tweet:${tid}`);
      console.log(`    text:           ${hash.text ? hash.text.slice(0, 80) : ''}...`);
      console.log(`    created_at:     ${hash.created_at}`);
      console.log(`    favorite_count: ${hash.favorite_count}`);
      console.log(`    retweet_count:  ${hash.retweet_count}`);
      console.log(`    screen_name:    ${hash.screen_name}`);
      console.log(`    user_name:      ${hash.user_name}`);
    }
  }

  // --- close connections ---
  await mongoClient.close();
  await redisClient.quit();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
