# Redis Tweet Analytics + CRUD

A small Node.js project that uses **Redis** to analyze and manage tweet data.
It began as my CS3200 Assignment 6 project (MongoDB + Redis) and has been extended into a Redis-focused project with full **CRUD** support on a Redis Hash data structure.

---

## Project Overview

- Tweet data is loaded from a local MongoDB collection.
- Five query scripts (`Query1.js` – `Query5.js`) populate different Redis data structures and answer analytical questions about the tweets.
- A new script (`crud.js`) implements **Create / Read / Update / Delete** operations on individual tweet records stored as Redis Hashes.

This is a plain command-line project. There is no web app, no Express server, and no front-end — just Node.js scripts you run in a terminal.

---

## Technologies Used

| Tool | Purpose |
|------|---------|
| Node.js | Runtime for all scripts |
| Redis | Primary data store for this project (CRUD + analytics) |
| MongoDB | Source of the original tweet dataset |
| `redis` npm package | Redis client |
| `mongodb` npm package | MongoDB client |

---

## Dataset / Database

- **MongoDB database:** `ieeevisTweets`
- **Collection:** `tweets`
- **Redis:** `localhost:6379` (default)
- **MongoDB:** `localhost:27017` (default)

Tweets are pulled from MongoDB once, then stored and queried in Redis.

---

## Redis Data Structure Design

The main record type is a **Hash**, one per tweet:

```
Key:   tweet:<tweet_id>
Type:  Hash
Fields: id, screen_name, text, favorite_count, retweet_count, created_at, user_name
```

A supporting **List** acts as a per-user index of tweet ids:

```
Key:   tweets:<screen_name>
Type:  List
Value: tweet_id, tweet_id, tweet_id, ...
```

Additional structures used by the query scripts:

| Query | Redis structure | Key |
|-------|-----------------|-----|
| Query1 | String (counter) | `tweetCount` |
| Query2 | String (sum) | `favoritesSum` |
| Query3 | Set | `screen_names` |
| Query4 | Sorted Set | `leaderboard` |
| Query5 | Lists + Hashes | `tweets:<screen_name>`, `tweet:<tweet_id>` |

---

## CRUD Operations

CRUD is implemented in `crud.js` and targets the Hash `tweet:<tweet_id>`.

| Operation | Redis commands used | What it does |
|-----------|---------------------|--------------|
| **Create** | `HSET`, `RPUSH` | Creates a new tweet hash and appends its id to the user's list |
| **Read**   | `HGETALL` | Fetches all fields of a tweet hash |
| **Update** | `HGET`, `HSET` | Updates one field of a tweet hash and prints before/after |
| **Delete** | `DEL`, `LREM` | Deletes the hash and removes the id from the user's list |

---

## Install Dependencies

```bash
npm install
```

---

## Running Redis and MongoDB Locally

Make sure both services are running before executing any script.

**Redis** (default port 6379):

```bash
redis-server
```

**MongoDB** (default port 27017):

```bash
mongod
```

You can confirm they are reachable with:

```bash
redis-cli ping      # should return PONG
mongosh             # should open a Mongo shell
```

---

## Running the Query Scripts

Each file is self-contained:

```bash
node Query1.js   # Count total tweets         (Redis key: tweetCount)
node Query2.js   # Sum of favorite_counts     (Redis key: favoritesSum)
node Query3.js   # Count distinct users       (Redis set: screen_names)
node Query4.js   # Top 10 users by tweet count (Sorted Set: leaderboard)
node Query5.js   # Store tweets as Lists + Hashes, then demo retrieval
```

Or via npm scripts:

```bash
npm run query1
npm run query2
npm run query3
npm run query4
npm run query5
```

Run `Query5.js` first if you want data available for the CRUD demo.

---

## Running the CRUD Demo

```bash
# CREATE a tweet
node crud.js create 99999 testuser "hello from crud demo" 5

# READ a tweet
node crud.js read 99999

# UPDATE a field
node crud.js update 99999 favorite_count 42

# DELETE a tweet (also cleans up the user's list)
node crud.js delete 99999 testuser
```

Or via npm:

```bash
npm run crud:create -- 99999 testuser "hello from crud demo" 5
npm run crud:read   -- 99999
npm run crud:update -- 99999 favorite_count 42
npm run crud:delete -- 99999 testuser
```

---

## Project Structure

```
.
├── Query1.js        # counter
├── Query2.js        # sum
├── Query3.js        # set of users
├── Query4.js        # sorted-set leaderboard
├── Query5.js        # lists + hashes (seeds CRUD data)
├── crud.js          # CRUD operations on tweet:<id>
├── package.json
└── README.md
```

---

## GitHub Best Practices

- Clear README with setup and run instructions
- One responsibility per script
- Dependencies tracked in `package.json`
- Commits describe what changed
- No secrets or credentials committed

---

## AI Disclosure

AI tools were used during this project for planning, debugging, and writing assistance (for example, brainstorming the Redis data structure design and reviewing the CRUD script). All final code was read, understood, and tested by me, and I am able to explain each line.

---

## Video Walkthrough

<!-- Paste your video link below once recorded -->
**Link:** _TBD_
