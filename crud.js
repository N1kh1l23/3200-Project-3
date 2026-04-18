// crud.js
// CS3200 - Redis CRUD demo
//
// CRUD operations for the Redis Hash `tweet:<tweet_id>`,
// matching the design used in Query5.js.
//
// Main record:      Hash  tweet:<tweet_id>
// Supporting index: List  tweets:<screen_name>
//
// Usage:
//   node crud.js create <tweet_id> <screen_name> "<text>" <favorite_count>
//   node crud.js read   <tweet_id>
//   node crud.js update <tweet_id> <field> <value>
//   node crud.js delete <tweet_id> <screen_name>

const { createClient } = require('redis');

async function main() {
  const [, , command, ...args] = process.argv;

  if (!command) {
    printUsage();
    process.exit(1);
  }

  const redisClient = createClient({ url: 'redis://localhost:6379' });
  await redisClient.connect();

  try {
    switch (command.toLowerCase()) {
      case 'create':
        await createTweet(redisClient, args);
        break;
      case 'read':
        await readTweet(redisClient, args);
        break;
      case 'update':
        await updateTweet(redisClient, args);
        break;
      case 'delete':
        await deleteTweet(redisClient, args);
        break;
      default:
        console.log(`Unknown command: ${command}`);
        printUsage();
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await redisClient.quit();
  }
}

// --- CREATE ---
async function createTweet(client, args) {
  const [tweetId, screenName, text, favoriteCount] = args;

  if (!tweetId || !screenName || !text) {
    console.log('Usage: node crud.js create <tweet_id> <screen_name> "<text>" <favorite_count>');
    return;
  }

  const key = `tweet:${tweetId}`;

  // don't overwrite an existing tweet
  const exists = await client.exists(key);
  if (exists) {
    console.log(`Tweet ${tweetId} already exists. Use update instead.`);
    return;
  }

  await client.hSet(key, {
    id:             tweetId,
    screen_name:    screenName,
    text:           text,
    favorite_count: String(favoriteCount || 0),
    retweet_count:  '0',
    created_at:     new Date().toUTCString(),
  });

  // also add the tweet id to the user's list
  await client.rPush(`tweets:${screenName}`, tweetId);

  console.log(`CREATED tweet:${tweetId}`);
  console.log(await client.hGetAll(key));
}

// --- READ ---
async function readTweet(client, args) {
  const [tweetId] = args;

  if (!tweetId) {
    console.log('Usage: node crud.js read <tweet_id>');
    return;
  }

  const key = `tweet:${tweetId}`;
  const hash = await client.hGetAll(key);

  if (Object.keys(hash).length === 0) {
    console.log(`No tweet found for id ${tweetId}`);
    return;
  }

  console.log(`READ tweet:${tweetId}`);
  console.log(hash);
}

// --- UPDATE ---
async function updateTweet(client, args) {
  const [tweetId, field, ...valueParts] = args;
  const value = valueParts.join(' ');

  if (!tweetId || !field || !value) {
    console.log('Usage: node crud.js update <tweet_id> <field> <value>');
    return;
  }

  const key = `tweet:${tweetId}`;
  const exists = await client.exists(key);
  if (!exists) {
    console.log(`No tweet found for id ${tweetId}`);
    return;
  }

  const before = await client.hGet(key, field);
  await client.hSet(key, field, value);
  const after = await client.hGet(key, field);

  console.log(`UPDATED tweet:${tweetId}`);
  console.log(`  ${field}: ${before}  ->  ${after}`);
}

// --- DELETE ---
async function deleteTweet(client, args) {
  const [tweetId, screenName] = args;

  if (!tweetId) {
    console.log('Usage: node crud.js delete <tweet_id> <screen_name>');
    return;
  }

  const key = `tweet:${tweetId}`;
  const exists = await client.exists(key);
  if (!exists) {
    console.log(`No tweet found for id ${tweetId}`);
    return;
  }

  await client.del(key);

  // also remove the tweet id from the user's list (if screen_name was given)
  if (screenName) {
    const removed = await client.lRem(`tweets:${screenName}`, 0, tweetId);
    console.log(`DELETED tweet:${tweetId}  (also removed ${removed} entry from tweets:${screenName})`);
  } else {
    console.log(`DELETED tweet:${tweetId}`);
  }
}

function printUsage() {
  console.log('Usage:');
  console.log('  node crud.js create <tweet_id> <screen_name> "<text>" <favorite_count>');
  console.log('  node crud.js read   <tweet_id>');
  console.log('  node crud.js update <tweet_id> <field> <value>');
  console.log('  node crud.js delete <tweet_id> <screen_name>');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
