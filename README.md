#pino-express
Custom Pino express middleware

##  Install

```sh
npm i pino-express
```
##  Use with [pino](https://getpino.io/#/)
```js
const app = require('express')
const pino = require('pino')()
const pinoExpress = require('pino-express')

app.use(pinoExpress(pino));

app.get('/', function (req, res) {
  req.log.info('something')
  res.send('hello world')
})

app.listen(3000)
```

## Use with [pino-multi-stream](https://github.com/pinojs/pino-multi-stream)
```js

const app = require('express')
const pinoms = require('pino-multi-stream');
const pinoExpress = require('pino-express');
const fs = require('fs');

const streams = [
  { stream: process.stdout},
  { stream: fs.createWriteStream('logs/pino.log')}
  // {level: 'fatal', stream: fs.createWriteStream('/tmp/fatal.stream.out')}
];
let logger = pinoms({streams: streams});
global.logger = logger;

app.use(pinoExpress(logger));

app.get('/', function (req, res) {
  req.log.info('something')
  res.send('hello world')
})

app.listen(3000)
```