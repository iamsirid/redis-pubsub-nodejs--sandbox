const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const redis = require('redis');
const redisClient = redis.createClient({
  host: 'localhost',
  port: '6379',
  retry_strategy: () => 1000
});

redisClient.on('connect', function() {
  console.log('connected');
});

const redisPublisher = redisClient.duplicate();

app.get('/val', async (req, res) => {
  console.log('GET');
  redisClient.hgetall('values', (err, values) => {
    res.send(values);
  });
});

app.post('/val', async (req, res) => {
  console.log('POST');
  redisClient.hset('values', 1, 'Nothing yet!');
  redisPublisher.publish('insert', 1);
  res.send({ working: true });
});

app.listen(5000, err => {
  console.log('listening');
});
