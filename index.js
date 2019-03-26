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
      headers: this._headers,
      method: req.method,
      requestUrl: req.protocol +'://'+ req.headers['host'] + req.url,
      shouldKeepAlive: this.shouldKeepAlive,
      statusCode: statusCode,
      statusMessage: this.statusMessage,
    };

    log[useLevel]({
      user: req.user,
      user_id: req.user && req.user.sub,
      res: response,
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
    }, `${this.req.method} ${this.req.url} errored after ${this.req.duration()}!`);
  }

  function loggingMiddleware (req, res, next) {
    req.id = genReqId(req);
    res.locals[startTime] = res.locals[startTime] || Date.now();
    req.duration = req.duration || function () { return ms(Date.now() - res.locals[startTime]) };
    req.log = res.log = logger.child({id: req.id});

    if(!res.locals['isInitiated']){   //  Prevents double up listeners
      res.on('finish', onResFinished);
      res.on('error', onResError);
      let reqObject = buildReqObject(req);
      req.log.info(reqObject, `${req.method} ${req.url} -> Request started..`);
    }

    res.locals['isInitiated'] = true;
    if (next) next()
  }
}

function buildReqObject(req) {
  const request = {
    headers: req.headers,
    body: req.body,
    method: req.method,
    params: req.params,
    protocol: req.protocol,
    query: req.query,
    requestUrl: req.protocol +'://'+ req.headers['host'] + req.url,
    url: req.url,
  };
  return {
    req: request,
    user_id: req.user && req.user.sub //  Add's user_id if exists
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
