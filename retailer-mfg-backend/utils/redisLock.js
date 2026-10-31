const Redis = require('ioredis');
// Extract the default class from the latest redlock package
const { default: Redlock } = require('redlock');

const redisClient = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1', port: 6379 });

const redlock = new Redlock(
    [redisClient],
    {
        driftFactor: 0.01, // time drift
        retryCount: 10,    // how many times to retry acquiring the lock
        retryDelay: 200,   // wait 200ms between retries
        retryJitter: 200   // randomize retries to prevent stampedes
    }
);

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis Distributed Lock Engine'));

module.exports = redlock;