const redis = require('redis');
let ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const os = require('os');
const fs = require('fs');
const https = require('https');
const http = require('http');

const redisClient = redis.createClient({
  host: 'localhost',
  port: '6379',
  retry_strategy: () => 1000
});
const sub = redisClient.duplicate();

const promisifyCommand = command =>
  new Promise((resolve, reject) =>
    command
      .on('end', resolve)
      .on('error', reject)
      .run()
  );

const checkVideoMetadata = () =>
  new Promise((resolve, reject) => {
    ffmpeg.ffprobe(`${os.tmpdir()}/temp_vid`, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

// function fib(index) {
//   if (index < 2) return 1;
//   return fib(index - 1) + fib(index - 2);
// }
const download = url => {
  const dest = `${os.tmpdir()}/temp_vid`;
  var file = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https
      .get(url, response => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve()); // close() is async, call cb after close completes.
        });
      })
      .on('error', err => {
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        reject(err);
      });
  });
};
const encodeVid = async () => {
  const { width, height } = (await checkVideoMetadata()).streams[0];

  console.log(`video resolution is ${width} x ${height}`);

  await promisifyCommand(
    ffmpeg(`${os.tmpdir()}/temp_vid`)
      .format('mp4')
      .size('?x240')
      .save(`./temp_vid--240p.mp4`)
  );
  console.log('240p out');

  if (height >= 480) {
    await promisifyCommand(
      ffmpeg(`${os.tmpdir()}/temp_vid`)
        .format('mp4')
        .size('?x480')
        .save(`./temp_vid--480p.mp4`)
    );
    console.log('480p out');
  }
  if (height >= 720) {
    await promisifyCommand(
      ffmpeg(`${os.tmpdir()}/temp_vid`)
        .format('mp4')
        .size('?x720')
        .save(`./temp_vid--720p.mp4`)
    );
    console.log('720p out');
  }

  if (height >= 1080) {
    await promisifyCommand(
      ffmpeg(`${os.tmpdir()}/temp_vid`)
        .format('mp4')
        .size('?x1080')
        .save(`./temp_vid--1080p.mp4`)
    );
    console.log('1080p out');
  }
};

sub.on('message', async (channel, message) => {
  console.log('reach');
  await download(
    'https://d3bju2ofgne5ys.cloudfront.net/videos/~4xwcj6GBliOH86'
  );
  console.log('download successfully');
  await encodeVid();
  console.log('encode successfully');
  redisClient.hset('values', message, 'successful');
});
sub.subscribe('insert');
