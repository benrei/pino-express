# pino-express

Custom Pino express middleware

Each request get it's own log id. This helps searching between async logs. See output sections

##  Install

```sh
npm i pino-express
```

##  Usage
`pino-express` adds three props to each express's `req` obj
1. `req.log.[level]`, the pino logger. [Levels](http://getpino.io/#/docs/api?id=loggerlevel-string-gettersetter): (trace,debug,info,warn,error,fatal,silent)
1. `req.id`, unique id for each request
2. `req.duration()`, used to calculate how long a req has been running.

##  Use with [pino](https://getpino.io/#/)
```js
const app = require('express')()
const pino = require('pino')()
const pinoExpress = require('pino-express')

app.use(pinoExpress(pino));

app.get('/foo/bar', function (req, res) {
  req.log.info('I have something to log!')
  const dummyError = {error:{message: 'foo bar'}};
  req.log.error(dummyError, 'This is not okay!')
  req.log.info(`How long did this take? ${req.duration()}`)
  res.send('hello world')
})

app.listen(3000)
```
### Output
```json
{"level":30,"time":1540374819416,"msg":"GET /foo/bar Request started..","pid":94018,"hostname":"brMBP.local","id":1,"request":{"requestUrl":"http://localhost:3000/","method":"GET"},"requestHeaders":{"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8","accept-encoding":"gzip, deflate, br","accept-language":"nb-NO,nb;q=0.9,en-US;q=0.8,en;q=0.7,no;q=0.6,nn;q=0.5","connection":"keep-alive","host":"localhost:3000","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36"},"v":1}
{"level":30,"time":1540375273277,"msg":"I have something to log!","pid":94327,"hostname":"brMBP.local","id":1,"v":1}
{"level":50,"time":1540375273277,"msg":"This is not okay!","pid":94327,"hostname":"brMBP.local","id":1,"error":{"message":"foo bar"},"v":1}
{"level":30,"time":1540375273277,"msg":"How long did this take? 2ms","pid":94327,"hostname":"brMBP.local","id":1,"v":1}
{"level":30,"time":1540374819426,"msg":"GET /foo/bar -> Request finished in 11ms!","pid":94018,"hostname":"brMBP.local","id":1,"response":{"requestUrl":"http://localhost:3000/","method":"GET","statusCode":304,"statusMessage":"Not Modified"},"responseTime":"11ms","v":1}
```
For prettified output, see the [Optional step](#optional)

##  Use with [pino-multi-stream](https://github.com/pinojs/pino-multi-stream)
```js
const app = require('express')()
const pinoms = require('pino-multi-stream');
const pinoExpress = require('pino-express');
const fs = require('fs');

if (!fs.existsSync('logs')) fs.mkdirSync('logs');
const streams = [
  //  See optional step for pretty console output
  { stream: process.stdout},  // logs to console
  { stream: fs.createWriteStream('logs/pino.log')}  // logs to file
  // {level: 'fatal', stream: fs.createWriteStream('/logs/pino_fatal.log')}
];
let logger = pinoms({streams: streams});
//  global.logger = logger;

app.use(pinoExpress(logger));

app.get('/', function (req, res) {
  req.log.info('I have something to log!')
  const dummyError = {error:{message: 'foo bar'}};
  req.log.error(dummyError, 'This is not okay!')
  req.log.info(`How long did this take? ${req.duration()}`)
  res.send('hello world')
})

app.listen(3000)
```

## Optional
### Use with [pino-pretty](https://github.com/pinojs/pino-pretty)
>$ npm i pino-pretty -g

To prettify log output, use `pino-pretty` in either:

Console
```sh
> node app.js | pino-pretty -c -t
```

Or in package.json
```js
{
  ...
  "scripts": {
    "start": "node app.js | pino-pretty -c -t"  //  Prettify console logging output
  }
}
```

### Output
```sh
[2018-10-24 09:38:10.365 +0000] INFO (93998 on brMBP.local): GET /foo/bar -> Request started..
    id: 1
    request: {
      "requestUrl": "http://localhost:3000/",
      "method": "GET"
    }
    requestHeaders: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "accept-encoding": "gzip, deflate, br",
      "accept-language": "nb-NO,nb;q=0.9,en-US;q=0.8,en;q=0.7,no;q=0.6,nn;q=0.5",
      "connection": "keep-alive",
      "host": "localhost:3000",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.67 Safari/537.36"
    }
[2018-10-24 09:38:10.367 +0000] INFO (93998 on brMBP.local): I have something to log!
    id: 1
[2018-10-24 09:38:10.367 +0000] ERROR (93998 on brMBP.local): This is not okay!
    id: 1
    error: {
      "message": "foo bar"
    }
[2018-10-24 09:38:10.368 +0000] INFO (93998 on brMBP.local): How long did this take? 3ms
    id: 1
[2018-10-24 09:38:10.375 +0000] INFO (93998 on brMBP.local): GET /foo/bar -> Request finished in 11ms!
    id: 1
    response: {
      "requestUrl": "http://localhost:3000/",
      "method": "GET",
      "statusCode": 304,
      "statusMessage": "Not Modified"
    }
    responseTime: "11ms"
```
