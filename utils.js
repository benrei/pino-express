var get = require('lodash.get');

const defaultStartLog = {
  req: ['req.body','req.headers','req.method','req.params','req.protocol','req.query','req.url'],
  user: 'req.user',
};

const defaultMiddlewareLog = {
  req: ['req.body','req.headers','req.method','req.params','req.protocol','req.query','req.url'],
  user: 'req.user',
};

const defaultErrorLog = {
  err: 'err',
  req: ['req.body','req.headers','req.method','req.params','req.protocol','req.query','req.url'],
  res: ['res._headers','res.shouldKeepAlive','res.statusCode','res.statusMessage'],
  user: 'req.user',
};

const defaultFinishedLog = {
  res: ['res._headers','res.shouldKeepAlive','res.statusCode','res.statusMessage'],
  user: 'req.user',
};


const buildObject = (source, options) =>{
  let obj = {};
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      // do stuff
      const current = options[key];
      obj[key] = {};

      // If string
      if(typeof current === 'string' || current instanceof String){
        obj[key] = get(source, current)
      }
      //  If array
      else if(Array.isArray(current)){
        current.forEach(path=>{
          const keyFromPath = path.replace(key+'.', '');
          obj[key][keyFromPath] = get(source, path)
        })
      }
      //  If object
      else if(typeof current === 'object' && current !== null){
        obj[key] = buildObject(source, current)
      }
    }
  }
  return obj;
};


module.exports = {
  buildObject,
  defaultOptions: {
    startLog:defaultStartLog,
    middlewareLog: defaultMiddlewareLog,
    errorLog: defaultErrorLog,
    finishedLog: defaultFinishedLog
  }
};