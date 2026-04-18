// Query4.js  –  CS3200 Assignment 6
// ─────────────────────────────────────────────────────────────────
// Rank users by tweet count using a Redis Sorted Set, then print
// the top 10 in descending order.
//
// Redis operations used:
//   ZINCRBY leaderboard 1 <screen_name>   ← add 1 to user's score
//   ZREVRANGE leaderboard 0 9 WITHSCORES  ← top 10, highest first
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

  // Clear any data left from a previous run
  await redis.del('leaderboard');

  // Step 1 – loop over every tweet and ZINCRBY the user's score by 1
  const allTweets = await tweets
    .find({}, { projection: { 'user.screen_name': 1 } })
    .toArray();

  for (const tweet of allTweets) {
    const name = tweet.user && tweet.user.screen_name;
    if (name) {
      await redis.zIncrBy('leaderboard', 1, String(name));
    }
  }

  // Step 2 – ZREVRANGE: get top 10 members, highest score first,
  //           with their scores so we can display the tweet counts
  const top10 = await redis.zRangeWithScores('leaderboard', 0, 9, { REV: true });

  console.log('Top 10 users by tweet count:');
  top10.forEach((entry, i) => {
    console.log(`  ${i + 1}. ${entry.value}  (${entry.score} tweets)`);
  });

  // ── close connections ────────────────────────────────────────────
  await mongo.close();
  await redis.quit();
}

main().catch(err => { console.error(err); process.exit(1); });
