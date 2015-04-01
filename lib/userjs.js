var domain = require('domain');
var events = require('events');
var fs = require('fs');
var path = require('path');
var util = require('util');
var console = require('console');
var jsdom = require('jsdom');
var request = require('request');
var Promise = require('q').Promise;

var copy = require('./nodesupport').copy;
var scriptsregistry = require('./scriptsregistry');

var default_jsdom_config={
  //deferClose:true,
  features:{
    //MutationEvents:['2.0'],
    FetchExternalResources: ["script", "iframe"],
    ProcessExternalResources: ["script"]
  }
};
if(process.env.http_proxy) {
  default_jsdom_config.proxy = process.env.http_proxy;
  //console.log('proxy = '+default_jsdom_config.proxy);
}/* else {
  console.log('no http_proxy');
}*/

default_jsdom_config.jar = request.jar();
var req = {jar:default_jsdom_config.jar};
//req.debug = true;
if(default_jsdom_config.proxy) req.proxy = default_jsdom_config.proxy;
//req = request.defaults(req);
function resourceLoader(resource, callback) {
  //console.log('resourceLoader '+resource.url.href);
  //req.jar.setCookie(resource.cookie, resource.cookieDomain);
  var cfg = copy(req);
  cfg.url = resource.url.href;
  return request.get(cfg, function(err, res, responseText) {
    if(err) return resource.defaultFetch(callback);
    return callback(err, responseText);
  }).on('error', function(err) {
    //console.error('resourceLoader: req.error: '+err);
    return resource.defaultFetch(callback);
  });
}
default_jsdom_config.resourceLoader = resourceLoader;

//{{class MicroformatEngineBase
function MicroformatEngineBase() {
  this.config = copy(this.default_config);
  this.clearCache();
}

util.inherits(MicroformatEngineBase, events.EventEmitter);

MicroformatEngineBase.prototype.clearCache = function() {
  this.mfCount = this.mfArray = null;
};

//}}class MicroformatEngineBase

//{{class LocalMicroformatEngine
function LocalMicroformatEngine() {
  if(LocalMicroformatEngine.prototype.module === null)
    LocalMicroformatEngine.prototype.module = require('./Microformats');
  MicroformatEngineBase.call(this);
}

util.inherits(LocalMicroformatEngine, MicroformatEngineBase);

LocalMicroformatEngine.prototype.module = null; // lazy load

LocalMicroformatEngine.prototype.default_config = {
  recurseExternalFrames:true,
  showHidden:true,
  debug:false
//  debug:true
};

LocalMicroformatEngine.prototype.count = function(document) {
  if(this.mfCount !== null) return this.mfCount;
  var sum = 0, Microformats = this.module.Microformats;
  Microformats.list.forEach(function(mftype) {
    var count = Microformats.count(mftype, document.documentElement, this.config);
    sum += count;
  });
  this.mfCount = sum;
  return sum;
};

LocalMicroformatEngine.prototype.array = function(document) {
  if(this.mfArray !== null) return this.mfArray;
  var res = {}, Microformats = this.module.Microformats;
  Microformats.list.forEach(function(mftype) {
    var arr = Microformats.get(mftype, document.documentElement, this.config);
    console.log(arr);
    res[mftype] = arr;
  });
  this.mfArray = sum;
  return sum;
};

//}}class LocalMicroformatEngine

//{{class MicroformatNodeEngine
function MicroformatNodeEngine() {
  if(MicroformatNodeEngine.prototype.module === null)
    MicroformatNodeEngine.prototype.module = require("microformat-node");
  MicroformatEngineBase.call(this);
}

util.inherits(MicroformatNodeEngine, MicroformatEngineBase);

MicroformatNodeEngine.prototype.module = null; // lazy load

MicroformatNodeEngine.prototype.default_config = {
  logLevel:0
};

MicroformatNodeEngine.prototype.count = function(document) {
  if(this.mfCount !== null) return this.mfCount;
  this.array(document);
  if(this.mfCount === null) return 0;
  return this.mfCount;
};

MicroformatNodeEngine.prototype.array = function(document) {
  if(this.mfArray !== null) return this.mfArray;
  this.mfCount = null;
  var array = null, errors, cfg = copy(this.config);
  //cfg.baseUrl = document.location.href;
  cfg.baseUrl = document.baseURI;
  this.module.parseHtml(document.documentElement.outerHTML, cfg, function(err, data) {
    errors = err;
    array = data;
  });
  if(errors) this.emit('warn', errors);
  if(!array) return null;
  if(!array.items) return null;
  var res = {}, sum = 0;

  function unpackMF(mf) {
    mf.type.forEach(function(mft) {
      if(!res[mft])
        res[mft] = [];
      if(!res[mft].includes(mf.properties)) {
        sum += 1;
        res[mft].push(mf.properties);
        Object.keys(mf.properties).forEach(function(prop) {
          mf.properties[prop].forEach(function(elem) { if(elem.type !== undefined) unpackMF(elem); });
        });
      }
    });
    if(mf.children)
      mf.children.forEach(unpackMF);
  }
  array.items.forEach(unpackMF);

  function simplifyMF(mf, mft) {
    Object.keys(mf).forEach(function(prop) {
      if(!util.isArray(mf[prop])) return;
      var newList = mf[prop].filter(function(elem) { return elem.type === undefined; });
      newList = newList.map(function(elem) { if(elem.html !== undefined) return elem.html; return elem; });
      mf[prop] = newList[newList.length-1];
    });
    mf.semanticType = mft;
    return mf;
  }
  Object.keys(res).forEach(function(mft) {
    res[mft] = res[mft].map(function(mf){return simplifyMF(mf, mft);});
  });
  /*Object.keys(res).forEach(function(mft) {
    var uniq = new Set();
    res[mft].forEach(function(mf) {
      mfs = JSON.stringify(mf);
      if(!set.has(mfs))
        mf.duplicate = true;
      set.add(mfs);
    });
  });*/
  this.mfCount = sum;
  this.mfArray = res;
  //console.log('res = ', res);
  return res;
};

//}}class MicroformatNodeEngine

//{{class UserJSApply
function UserJSApply(url, scriptNames, jQueryify) {
  var emit = this.emit;

  this.window = null;
  this._want_posthock = true;
  this.url = url;
  //this.mf = new MicroformatNodeEngine();
  this.mf = new LocalMicroformatEngine();
  this.mf.on('warn', function(errors) { emit('warn', errors); });
  if(scriptNames === undefined) {
    scriptNames = scriptsregistry.url2scriptinfo(url);
  }
  //console.log('scriptNames =', scriptNames);
  var scripts = util.isArray(scriptNames)?scriptNames:[scriptNames];
  //console.log('scriptsregistry.ensureScriptInfo =', scriptsregistry.ensureScriptInfo);
  scripts = scripts.map(scriptsregistry.ensureScriptInfo);
  if(jQueryify === undefined) {
    jQueryify = scripts.some(function(si){return si.wantsJQuery(); });
  }
  this.jQueryify = jQueryify;
  this.scripts = scripts.map(function(si){si.readSync();return si;});
  if(true) {
    process.nextTick(this.startup.bind(this));
  } else {
    this.startup();
  }
}

util.inherits(UserJSApply, events.EventEmitter);

UserJSApply.prototype.startup = function UserJSApply_startup() {
  var cfg = copy(default_jsdom_config);
  cfg.url = this.url;
  //if(jQueryify) cfg.scripts = [jQueryUrl];
  if(this.jQueryify) cfg.src = [jQueryScript];
  cfg.done = this.window_ondone.bind(this);
  this.mf.clearCache();
  jsdom.env(cfg);
};

UserJSApply.prototype.check_warn = function UserJSApply_check_warn() {
  if(this.window.document.errors && this.window.document.errors.length) {
    this.emit('warn', this.window.document.errors);
    while(this.window.document.errors.length)
      this.window.document.errors.pop();
  }
};

UserJSApply.prototype.window_ondone = function UserJSApply_window_ondone(errors, window) {
  if(!window) {
    this.emit('error', new Error('No window object created'), errors);
    return;
  }
  this.window = window;
  if(errors) {
    this.emit('warn', errors);
    if(window.document.errors == errors) {
      while(window.document.errors.length)
        window.document.errors.pop();
    }
  }
  this.check_warn();
  this._want_posthock = true;
  this._want_posthock = !this.emit('load') && this._want_posthock;

  if(this.jQueryify && !window.jQuery) {
    this.emit('error', new Error('no jQuery'));
    this.close();
    return;
  }

  this.scriptsQueue = this.scripts.map(function(o){return o;});
  process.nextTick(this.userjs_queue.bind(this));
};

UserJSApply.prototype.userjs_queue = function UserJSApply_userjs_queue(res) {
  //console.log('userjs_queue: ', this.scriptsQueue.length);
  var script = this.scriptsQueue.pop();
  if(script === undefined) return this.userjs_onend();
  var res;
  var window = this.window, Event = window.Event;
  res = eval(script.readSync()); // jshint ignore:line
  //console.log('userjs_queue: ', script.scriptName, res);
  this.mf.clearCache();
  if((res !== undefined) && (typeof(res.then) === "function")) {
    //var onresult = this.userjs_onresult.bind(this);
    var self = this;
    function onresult(res) {
      self.userjs_onresult(script, res);
    }
    res.then(onresult, onresult);
  } else {
    this.userjs_onresult(script, res);
  }
};

UserJSApply.prototype.userjs_onresult = function UserJSApply_userjs_onresult(script, res) {
  //console.log('userjs_onresult: ', script.scriptName, res);
  this.check_warn();
  this._want_posthock = !this.emit('userjs', res, script) && this._want_posthock;
  process.nextTick(this.userjs_queue.bind(this));
};

UserJSApply.prototype.close = function UserJSApply_close() {
  //this.window.close();
  process.nextTick(this.window.close.bind(this.window));
  this.window = null;
};

UserJSApply.prototype.userjs_onend = function UserJSApply_userjs_onend(res) {
  if(this._want_posthock) {
    this.mfArray = this.getMFarray();
    this.mfCount = this.getMFcount();
  }
  this.close();
  this.emit('close');
};

UserJSApply.prototype.getMFcount = function UserJSApply_getMFcount() {
  return this.mf.count(this.window.document);
};

UserJSApply.prototype.getMFarray = function UserJSApply_getMFarray() {
  return this.mf.array(this.window.document);
};

//}}class UserJSApply

var jQueryUrl, jQueryScript = null;
//jQueryUrl = 'http://l-stat.livejournal.net/js/??scheme/schemius.js,ads/gpt.js,jquery/jquery.lj.repostbutton.js,threeposts.js,jquery/jquery.lj.ljcut.js,entry/main.js,jquery/jquery.lj.journalPromoStrip.js?v=1427460994';
//jQueryUrl = 'http://code.jquery.com/jquery-2.1.3.min.js';
jQueryUrl = path.resolve(path.dirname(module.filename), 'jquery-2.1.3.min.js');
jQueryScript = fs.readFileSync(jQueryUrl,{encoding:'utf-8'});

exports.UserJSApply = UserJSApply;
exports.MicroformatEngineBase = MicroformatEngineBase;
exports.MicroformatNodeEngine = MicroformatNodeEngine;
exports.LocalMicroformatEngine = LocalMicroformatEngine;
