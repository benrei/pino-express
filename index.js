'use strict'

const ms = require('ms');
const startTime = Symbol('startTime');

function pinoExpress (pino) {

  const logger = pino;
  let genReqId = reqIdGenFactory(pino.genReqId);
  return loggingMiddleware;

  function onResFinished () {
    this.removeListener('finish', onResFinished);

    let useLevel = 'info';
    const log = this.log;
    const req = this.req;
    const statusCode = this.statusCode;

    if(statusCode < 400) useLevel = 'info';
    if(statusCode >= 400 && statusCode < 500) useLevel = 'warn';
    if(statusCode >= 500) useLevel = 'error';

    const response = {
      requestUrl: req.protocol +'://'+ req.headers['host'] + req.url,
      method: req.method,
      statusCode: statusCode,
      statusMessage: this.statusMessage,
    };

    log[useLevel]({
      user_id: req.user && req.user.sub,
      response: response,
      responseTime: req.duration()
    }, `${req.method} ${req.url} -> Request finished in ${req.duration()}!`);
  }

  function onResError (err) {
    this.removeListener('error', onResError);

    const log = this.log;

    log.error({
      res: this,
      err: err || this.err || new Error('failed with status code ' + this.statusCode),
      responseTime: this.req.duration()
    }, `${req.method} ${req.url} errored after ${req.duration()}!`);
  }

  function loggingMiddleware (req, res, next) {
    req.id = genReqId(req);
    res.locals[startTime] = res.locals[startTime] || Date.now();
    req.duration = req.duration || function () { return ms(Date.now() - res.locals[startTime]) };
    req.log = res.log = logger.child({id: req.id});

    if(!res.locals['isInitiated']){   //  Prevents double up listeners
      res.on('finish', onResFinished);
      res.on('error', onResError);
      let requestInfo = getReqInfo(req);
      req.log.info(requestInfo, `${req.method} ${req.url} -> Request started..`);
    }

    res.locals['isInitiated'] = true;
    if (next) next()
  }
}

function getReqInfo(req) {
  const request = {
    requestUrl: req.protocol +'://'+ req.headers['host'] + req.url,
    method: req.method,
    body: req.body,
  };
  const requestHeaders = {
    accept: req.headers['accept'],
    'accept-encoding': req.headers['accept-encoding'],
    'accept-language': req.headers['accept-language'],
    authorization: req.headers['authorization'],
    connection: req.headers['connection'],
    host: req.headers['host'],
    origin: req.headers['origin'],
    referer: req.headers['referer'],
    userAgent: req.headers['user-agent'],
    'x-api-key': req.headers['x-api-key'],
  };
  return {
    request: request,
    requestHeaders: requestHeaders,
  }
}

function reqIdGenFactory (func) {
  if (typeof func === 'function') return func;
  const maxInt = 2147483647;
  let nextReqId = 0;
  return function genReqId (req) {
    return req.id || (nextReqId = (nextReqId + 1) & maxInt)
  }
}

module.exports = pinoExpress;
