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

var jQueryUrl;
var jQueryScript = null;

var defaults={};
defaults.jsdom={
  //deferClose:true,
  features:{
    //MutationEvents:['2.0'],
    FetchExternalResources: ['script', 'iframe'],
    ProcessExternalResources: ['script']
  }
};
if(process.env.http_proxy) {
  defaults.jsdom.proxy = process.env.http_proxy;
  //console.log('proxy = '+defaults.jsdom.proxy);
}/* else {
  console.log('no http_proxy');
}*/

defaults.jsdom.jar = request.jar();
defaults.request = {jar:defaults.jsdom.jar};
//defaults.request.debug = true;
if(defaults.jsdom.proxy) { defaults.request.proxy = defaults.jsdom.proxy; }
//defaults.request = request.defaults(defaults.request);
function resourceLoader(resource, callback, cache) {
  //console.log('resourceLoader: url: '+resource.url.href);
  //defaults.request.jar.setCookie(resource.cookie, resource.cookieDomain);
  if(cache) {
    return cache.get(resource.url.href, callback, resourceLoaderOnNoCache);
  }
  return resourceLoaderOnNoCache();
  function resourceLoaderOnNoCache(/*err*/) {
    //console.error('resourceLoader: error: '+err);
    var cfg = copy(defaults.request);
    cfg.url = resource.url.href;
    return request.get(cfg, function(err, res, responseText) {
      if(err) { return resource.defaultFetch(callback); }
      if(cache) {
        cache.put(cfg.url, responseText, function() { callback(err, responseText); });
      } else {
        callback(err, responseText);
      }
    }).on('error', function(/*err*/) {
      //console.error('resourceLoader: error: '+err);
      return resource.defaultFetch(callback);
    });
  }
}
defaults.jsdom.resourceLoader = resourceLoader;

//{{class MicroformatEngineBase
function MicroformatEngineBase() {
  this.config = copy(this.default_config);
  this.wantJQuery = false;
  this.clearCache();
}

util.inherits(MicroformatEngineBase, events.EventEmitter);

MicroformatEngineBase.prototype.clearCache = function() {
  this.mfCount = this.mfArray = null;
};

//}}class MicroformatEngineBase

//{{class LocalMicroformatEngine
function LocalMicroformatEngine() {
  if(LocalMicroformatEngine.prototype.module === null) {
    LocalMicroformatEngine.prototype.module = require('./Microformats');
  }
  MicroformatEngineBase.call(this);
}

util.inherits(LocalMicroformatEngine, MicroformatEngineBase);

LocalMicroformatEngine.prototype.module = null; // lazy load

LocalMicroformatEngine.prototype.default_config = {
  recurseExternalFrames:true,
  showHidden:true,
  debug:false
  //debug:true
};

LocalMicroformatEngine.prototype.count = function(document) {
  if(this.mfCount !== null) { return this.mfCount; }
  var sum = 0;
  var Microformats = this.module.Microformats;
  Microformats.list.forEach(function(mftype) {
    var count = Microformats.count(mftype, document.documentElement, this.config);
    sum += count;
  });
  this.mfCount = sum;
  return sum;
};

LocalMicroformatEngine.prototype.array = function(document) {
  if(this.mfArray !== null) { return this.mfArray; }
  var res = {};
  var Microformats = this.module.Microformats;
  Microformats.list.forEach(function(mftype) {
    var arr = Microformats.get(mftype, document.documentElement, this.config);
    console.log(arr);
    res[mftype] = arr;
  });
  this.mfArray = res;
  return res;
};

//}}class LocalMicroformatEngine

//{{class MicroformatNodeEngine
function MicroformatNodeEngine() {
  if(MicroformatNodeEngine.prototype.module === null) {
    MicroformatNodeEngine.prototype.module = require('microformat-node');
  }
  MicroformatEngineBase.call(this);
  this.wantJQuery = true;
}

util.inherits(MicroformatNodeEngine, MicroformatEngineBase);

MicroformatNodeEngine.prototype.module = null; // lazy load

MicroformatNodeEngine.prototype.default_config = {
  logLevel:0
};

MicroformatNodeEngine.prototype.count = function(document, window) {
  if(this.mfCount !== null) { return this.mfCount; }
  this.array(document, window);
  if(this.mfCount === null) { return 0; }
  return this.mfCount;
};

MicroformatNodeEngine.prototype.array = function(document, window) {
  if(this.mfArray !== null) { return this.mfArray; }
  this.mfCount = null;
  var array = null;
  var errors;
  var cfg = copy(this.config);
  //cfg.baseUrl = document.location.href;
  cfg.baseUrl = document.baseURI;
  cfg.logLevel = 4;
  var jDom = window.jQuery;
  var jRoot = window.jQuery(':root');
  console.log(jDom, jRoot);
  console.trace('before parseDom');
  if(false) {
    this.module.parseHtml(document.documentElement.outerHTML, cfg, onparse);
  } else {
    this.module.parseDom(jDom, jRoot, cfg, onparse);
  }
  function onparse(err, data) {
    errors = err;
    array = data;
  }
  if(errors) { this.emit('warn', errors); }
  if(!array || !array.items) { return null; }
  var res = {};
  var sum = 0;

  function unpackMF(mf) {
    mf.type.forEach(function(mft) {
      if(!res[mft]) { res[mft] = []; }
      if(!res[mft].includes(mf.properties)) {
        sum += 1;
        res[mft].push(mf.properties);
        Object.keys(mf.properties).forEach(function(prop) {
          mf.properties[prop].forEach(function(elem) { if(elem.type !== undefined) { unpackMF(elem); } });
        });
      }
    });
    if(mf.children) { mf.children.forEach(unpackMF); }
  }
  array.items.forEach(unpackMF);

  function simplifyMF(mf, mft) {
    Object.keys(mf).forEach(function(prop) {
      if(!util.isArray(mf[prop])) { return; }
      var newList = mf[prop].filter(function(elem) { return elem.type === undefined; });
      newList = newList.map(function(elem) { if(elem.html !== undefined) { return elem.html; } return elem; });
      mf[prop] = newList[newList.length-1];
    });
    mf.semanticType = mft;
    return mf;
  }
  Object.keys(res).forEach(function(mft) {
    res[mft] = res[mft].map(function(mf) { return simplifyMF(mf, mft); });
  });
  /*Object.keys(res).forEach(function(mft) {
    var uniq = new Set();
    res[mft].forEach(function(mf) {
      mfs = JSON.stringify(mf);
      if(!set.has(mfs)) {
        mf.duplicate = true;
      }
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
var SqliteCache = null;
function UserJSApply(url, scriptNames, jQueryify, cache) {
  var emit = this.emit;

  this.window = null;
  this._want_posthock = true;
  this.url = url;
  this.mf = new MicroformatNodeEngine();
  //this.mf = new LocalMicroformatEngine();
  this.mf.on('warn', function(errors) { emit('warn', errors); });
  this.cache = null;
  if(cache) {
    if(!SqliteCache) { SqliteCache = require('./urlcache').SqliteCache; }
    if(SqliteCache.prototype.isPrototypeOf(cache)) {
      this.cache = cache;
    } else {
      this.cache = new SqliteCache(cache);
    }
  }
  if(scriptNames === undefined) {
    scriptNames = scriptsregistry.url2scriptinfo(url);
  }
  //console.log('scriptNames =', scriptNames);
  var scripts = util.isArray(scriptNames) ? scriptNames : [scriptNames];
  //console.log('scriptsregistry.ensureScriptInfo =', scriptsregistry.ensureScriptInfo);
  scripts = scripts.map(scriptsregistry.ensureScriptInfo);
  if(jQueryify === undefined) {
    jQueryify = scripts.some(function(si) { return si.wantsJQuery(); });
  }
  if(this.mf.wantJQuery) {
    jQueryify = true;
  }
  this.jQueryify = jQueryify;
  this.scripts = scripts.map(function(si) { si.readSync(); return si; });
  if(false) {
    this.startup();
  } else {
    process.nextTick(this.startup.bind(this));
  }
}

util.inherits(UserJSApply, events.EventEmitter);

UserJSApply.prototype.startup = function() {
  var cfg = copy(defaults.jsdom);
  cfg.url = this.url;
  //if(jQueryify) cfg.scripts = [jQueryUrl];
  if(this.jQueryify) {
    cfg.src = [jQueryScript];
  }
  cfg.done = this.window_ondone.bind(this);
  this.mf.clearCache();
  if(!this.cache) {
    return jsdom.env(cfg);
  }

  var cache = this.cache;
  cfg.resourceLoader = function(resource, callback) { return resourceLoader(resource, callback, cache); };
  var resource = {url:{href:this.url}};
  cfg.resourceLoader(resource, function(err, data) {
    cfg.html = data;
    jsdom.env(cfg);
  });
};

UserJSApply.prototype.check_warn = function() {
  if(this.window.document.errors && this.window.document.errors.length) {
    this.emit('warn', this.window.document.errors);
    while(this.window.document.errors.length) {
      this.window.document.errors.pop();
    }
  }
};

UserJSApply.prototype.window_ondone = function(errors, window) {
  if(!window) {
    this.emit('error', new Error('No window object created'), errors);
    return;
  }
  this.window = window;
  if(errors) {
    this.emit('warn', errors);
    if(window.document.errors === errors) {
      while(window.document.errors.length) {
        window.document.errors.pop();
      }
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

  this.scriptsQueue = this.scripts.map(function(o) { return o; });
  process.nextTick(this.userjs_queue.bind(this));
};

UserJSApply.prototype.userjs_queue = function() {
  //console.log('userjs_queue: ', this.scriptsQueue.length);
  var script = this.scriptsQueue.pop();
  if(script === undefined) { return this.userjs_onend(); }

  var res;
  var window = this.window;
  var context = {window:window, Promise:Promise, Event:window.Event};
  res = eval(script.readSync(), context); // jshint ignore:line
  //console.log('userjs_queue: ', script.scriptName, res);
  this.mf.clearCache();
  if((res !== undefined) && (typeof(res.then) === 'function')) {
    var onresult = this.userjs_onresult.bind(this, script);
    res.then(onresult, onresult);
  } else {
    this.userjs_onresult(script, res);
  }
};

UserJSApply.prototype.userjs_onresult = function(script, res) {
  //console.log('userjs_onresult: ', script.scriptName, res);
  this.check_warn();
  this._want_posthock = !this.emit('userjs', res, script) && this._want_posthock;
  process.nextTick(this.userjs_queue.bind(this));
};

UserJSApply.prototype.close = function() {
  //this.window.close();
  process.nextTick(this.window.close.bind(this.window));
  this.window = null;
};

UserJSApply.prototype.userjs_onend = function() {
  if(this._want_posthock) {
    this.mfArray = this.getMFarray();
    this.mfCount = this.getMFcount();
  }
  this.close();
  this.emit('close');
};

UserJSApply.prototype.getMFcount = function() {
  return this.mf.count(this.window.document, this.window);
};

UserJSApply.prototype.getMFarray = function() {
  return this.mf.array(this.window.document, this.window);
};

//}}class UserJSApply

//jQueryUrl = 'http://l-stat.livejournal.net/js/??scheme/schemius.js,ads/gpt.js,jquery/jquery.lj.repostbutton.js' +
//  ',threeposts.js,jquery/jquery.lj.ljcut.js,entry/main.js,jquery/jquery.lj.journalPromoStrip.js?v=1427460994';
//jQueryUrl = 'http://code.jquery.com/jquery-2.1.3.min.js';
jQueryUrl = path.resolve(path.dirname(path.dirname(module.filename)), 'data', 'jquery-2.1.3.min.js');
jQueryScript = fs.readFileSync(jQueryUrl,{encoding:'utf-8'});

exports.UserJSApply = UserJSApply;
exports.MicroformatEngineBase = MicroformatEngineBase;
exports.MicroformatNodeEngine = MicroformatNodeEngine;
exports.LocalMicroformatEngine = LocalMicroformatEngine;
