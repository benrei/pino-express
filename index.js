'use strict';
const uuid = require('uuid/v1');
const ms = require('ms');

function pinoLogger (pino) {

  function onFinish (e) {
    this.removeListener('finish', onFinish);

    const log = this.log;
    let level = 'info';
    if(this.statusCode >= 400) level = 'error';

    const response = {
      requestUrl: this.req.headers['origin'] + this.req.url,
      method: this.req.method,
      statusCode: this.statusCode,
      statusMessage: this.statusMessage,
    };

    const duration = this.req.duration ? this.req.duration(): '';
    log[level]({
      id: this.locals.id,
      user_id: this.req.user && this.req.user.sub,
      response: response,
      responseTime: duration
    }, 'Request completed in ' + duration)
  }

  function onError(err) {
    this.removeListener('error', onError);

    const log = this.log;
    const message = this;

    if (err || this.err || this.statusCode >= 500) {
      const duration = this.req.duration ? this.req.duration(): '';
      log.error({
        id: this.locals.id,
        user_id: this.req.user && this.req.user.sub,
        message: message,
        err: err || this.err || new Error('failed with status code ' + this.statusCode),
        responseTime: duration
      }, 'Request errored in ' + duration);
      return
    }
  }

  return function loggingMiddleware (req, res, next) {
    req.log = res.log = pino;
    if(req.method !== 'OPTIONS'){
      const request = {
        requestUrl: req.headers['origin'] + req.url,
        method: req.method,
        host: req.headers['host'],
        params: req.params,
        query: req.query,
        body: req.body,
      };
      const requestHeaders = {
        accept: req.headers['origin'] + req.url,
        'accept-encoding': req.headers['accept-encoding'],
        'accept-language': req.headers['accept-language'],
        authorization: req.headers['authorization'],
        connection: req.headers['connection'],
        host: req.headers['host'],
        origin: req.headers['origin'],
        userAgent: req.headers['user-agent'],
        'x-api-key': req.headers['x-api-key'],
      };

      req.log.info({
        id: res.locals.id,
        request: request,
        requestHeaders: requestHeaders,
      }, 'Starting request..');

      res.on('finish', onFinish);
      res.on('error', onError);
    }

    if (next) next()
  }
}
function helperMiddleware(req, res, next) {
  res.locals['id'] = uuid();
  res.locals['startTime'] = Date.now();
  req.duration = ()=> {return ms(Date.now() - res.locals['startTime'])};
  return next();
}


module.exports.logger = pinoLogger;
module.exports.helper = helperMiddleware;
