#pino-express
Custom Pino express middleware

##  Install

```sh
npm i pino-express
```
##  Usage
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