# pino-express

Customable Pino express logging middleware

Each request get it's own log id. This helps searching between async logs. See output sections

Supports selecting own fields as log output, see [Options step](#options)
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

app.listen(8000)
```
### Output
```json
{"level":30,"time":1540xxxxxxxxx,"msg":"Started request -> GET /?foo=bar","pid":88912,"hostname":"brMBP.local","id":1,"req":{"body":{},"headers":{"host":"localhost:8000","connection":"keep-alive","cache-control":"max-age=0","upgrade-insecure-requests":"1","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3","accept-encoding":"gzip, deflate, br","accept-language":"nb-NO,nb;q=0.9,en-US;q=0.8,en;q=0.7,no;q=0.6,nn;q=0.5","if-none-match":"W/\"2d-NymZwe35GMWB2BEsXNShQkpRC2k\""},"method":"GET","params":{},"protocol":"http","query":{"foo":"bar"},"url":"/?foo=bar"},"v":1}
{"level":30,"time":1540xxxxxxxxx,"msg":"I have something to log!","pid":94327,"hostname":"brMBP.local","id":1,"v":1}
{"level":50,"time":1540xxxxxxxxx,"msg":"This is not okay!","pid":94327,"hostname":"brMBP.local","id":1,"error":{"message":"foo bar"},"v":1}
{"level":30,"time":1540xxxxxxxxx,"msg":"How long did this take? 2ms","pid":94327,"hostname":"brMBP.local","id":1,"v":1}
{"level":30,"time":1540xxxxxxxxx,"msg":"Finished request -> GET /?foo=bar, in 10ms!","pid":88912,"hostname":"brMBP.local","id":1,"res":{"_headers":{"x-powered-by":"Express","access-control-allow-origin":"*","etag":"W/\"2d-NymZwe35GMWB2BEsXNShQkpRC2k\""},"shouldKeepAlive":true,"statusCode":304,"statusMessage":"Not Modified"},"responseTime":"10ms","v":1}
```
For prettified output, see the [Optional step](#optional)


## Options
You can set up your own log output.

The default log output is build based on these `defaultOptions`.

```js
//  These are the default log objects
const defaultOptions = {
    //  Usage: Runs before request has entered it's route
    startLog:{
        //  Accepts array of strings
        req: ['req.body','req.headers','req.method','req.params','req.protocol','req.query','req.url'],
        //  Accepts string
        user: 'req.user',
        /*  Accepts object with string
        user: {
          user_id: 'req.user.sub'
        }
        */
        /*  Accepts object array of strings
        user: {
          foo: ['req.user.bar','req.user.bar1', 'req.user.bar2']
        }
        */
        
    },
    //  Usage: req.log.info('log msg') or req.log.[level]('log msg')..
    middlewareLog: {
        req: ['req.body','req.headers','req.method','req.params','req.protocol','req.query','req.url'],
        user: 'req.user',
    },
    //  Usage: Runs on response errored
    errorLog: {
        err: 'err',
        req: ['req.body','req.headers','req.method','req.params','req.protocol','req.query','req.url'],
        res: ['res._headers','res.shouldKeepAlive','res.statusCode','res.statusMessage'],
        user: 'req.user',
    },
    //  Usage: Runs after request.end() has been called
    finishedLog: {
        res: ['res._headers','res.shouldKeepAlive','res.statusCode','res.statusMessage'],
        user: 'req.user',
    }
}
//  
app.use(pinoExpress(pino, defaultOptions));

```

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

app.listen(8000)
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
[2018-10-24 09:38:10.367 +0000] INFO (88912 on brMBP.local): Started request -> GET /?foo=bar
    id: 1
    req: {
      "body": {},
      "headers": {
        "host": "localhost:8000",
        "connection": "keep-alive",
        "cache-control": "max-age=0",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "nb-NO,nb;q=0.9,en-US;q=0.8,en;q=0.7,no;q=0.6,nn;q=0.5",
        "if-none-match": "W/\"2d-NymZwe35GMWB2BEsXNShQkpRC2k\""
      },
      "method": "GET",
      "params": {},
      "protocol": "http",
      "query": {
        "foo": "bar"
      },
      "url": "/?foo=bar"
    }
[2018-10-24 09:38:10.367 +0000] INFO (93998 on brMBP.local): I have something to log!
    id: 1
[2018-10-24 09:38:10.367 +0000] ERROR (93998 on brMBP.local): This is not okay!
    id: 1
    error: {
      "message": "foo bar"
    }
[2018-10-24 09:38:10.368 +0000] INFO (93998 on brMBP.local): How long did this take? 1ms
    id: 1
[2018-10-24 09:38:10.377 +0000] INFO (88912 on brMBP.local): Finished request -> GET /?foo=bar, in 10ms!
    id: 1
    res: {
      "_headers": {
        "x-powered-by": "Express",
        "access-control-allow-origin": "*",
        "etag": "W/\"2d-NymZwe35GMWB2BEsXNShQkpRC2k\""
      },
      "shouldKeepAlive": true,
      "statusCode": 304,
      "statusMessage": "Not Modified"
    }
    responseTime: "10ms"
```
