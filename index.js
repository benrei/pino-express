'use strict';
const utils = require('./utils');

const ms = require('ms');
const startTime = Symbol('startTime');

function pinoExpress (pino, options = utils.defaultOptions) {

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

    let logObj = utils.buildObject({req: req, res: this}, options.finishedLog);
    logObj.responseTime = req.duration();

    log[useLevel](logObj, `Finished request -> ${req.method} ${req.url}, in ${req.duration()}!`);
  }

  function onResError (err) {
    this.removeListener('error', onResError);

    const log = this.log;

    let logObj = utils.buildObject({req: this.req, res: this, err: err || this.err}, options.errorLog);
    logObj.responseTime = this.req.duration();

    log.error(logObj, `${this.req.method} ${this.req.url} errored after ${this.req.duration()}!`);
  }

  /**
   * Logger pr request, found in req.log or res.log
   * @param req
   * @param res
   * @param next
   */
  function loggingMiddleware (req, res, next) {
    //  Set ut middleware logging
    //  Set unique id for each request (auto increment, starts at 1)
    req.id = genReqId(req);
    res.locals[startTime] = res.locals[startTime] || Date.now();
    //  Add duration func, (can be used during request to log time used)
    req.duration = req.duration || function () { return ms(Date.now() - res.locals[startTime]) };

    //  Build child logger
    let childLogger = utils.buildObject({req, res}, options.middlewareLog);
    childLogger.id = req.id;
    //  Add logger to req and res.
    req.log = res.log = logger.child(childLogger);

    //  Log request start
    if(!res.locals['isInitiated']){   //  Prevents double up listeners
      res.on('finish', onResFinished);
      res.on('error', onResError);
      let logObj = utils.buildObject({req, res}, options.startLog);
      req.log.info(logObj, `Started request -> ${req.method} ${req.url}`);
    }

    res.locals['isInitiated'] = true;
    if (next) next()
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
