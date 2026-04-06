# CS3200 Assignment 6 – MongoDB + Redis Tweet Queries

Node.js scripts that read tweet data from a local MongoDB collection and use Redis data structures to answer five analytical queries.

---

## Prerequisites

| Service  | Default address        |
|----------|------------------------|
| MongoDB  | `localhost:27017`      |
| Redis    | `localhost:6379`       |

- Database: `ieeevisTweets`
- Collection: `tweets`

Make sure both services are running before executing any query.

---

## Setup

```bash
npm install
```

---

## Running the queries

Each file is self-contained and can be run independently:

```bash
node Query1.js   # Count total tweets (Redis key: tweetCount)
node Query2.js   # Sum all favorite_counts (Redis key: favoritesSum)
node Query3.js   # Count distinct users (Redis set: screen_names)
node Query4.js   # Top 10 users by tweet count (Redis sorted set: leaderboard)
node Query5.js   # Store tweets as Redis Lists + Hashes, then demo retrieval
```

Or via npm scripts:

```bash
npm run query1
npm run query2
npm run query3
npm run query4
npm run query5
```

---

## What each query does

| File | Redis structure | Description |
|------|----------------|-------------|
| `Query1.js` | String (`tweetCount`) | Increments a counter once per tweet, prints total |
| `Query2.js` | String (`favoritesSum`) | Adds each tweet's `favorite_count`, prints the sum |
| `Query3.js` | Set (`screen_names`) | Adds every `user.screen_name`; `SCARD` gives distinct count |
| `Query4.js` | Sorted Set (`leaderboard`) | Scores = tweet counts per user; prints top 10 descending |
| `Query5.js` | Lists (`tweets:<screen_name>`) + Hashes (`tweet:<tweet_id>`) | Stores tweet ids per user and full tweet details, then demonstrates fetching them back |
