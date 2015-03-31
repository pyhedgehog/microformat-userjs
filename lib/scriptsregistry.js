var fs = require('fs');
var path = require('path');
var util = require('util');
var baseDir = path.dirname(path.dirname(module.filename));
var acorn = null; // lazy load

function glob2regexp(s) {
  return s.replace('\\','\\\\').replace(/([.\[])/g,'\\$1').replace('?','.').replace(/\*/g,'.*');
}

function urlglob2regexp(s) {
  var i1 = s.indexOf('://');
  var i2 = s.indexOf('/',i1+3);
  var proto, host='', path;
  if(i1>=0) {
    proto = glob2regexp(s.substr(0,i1)).replace('.*','[^/]*');
    if(i2>=0) {
      host = glob2regexp(s.substring(i1,i2)).replace('.*','[^/]*');
    } else {
      host = '';
      i2 = i1;
    }
    path = glob2regexp(s.substr(i2));
    return proto+host+path;
  } else {
    return glob2regexp(s);
  }
}

function ScriptInfo(scriptName, fields) {
  this.scriptName = scriptName;
  this.includes = this.fields = this.script = null;
  if(fields !== undefined && fields !== null)
    this.initFields(fields);
}

ScriptInfo.prototype.initFields = function(fields) {
  this.fields = fields;
  var includes = [];
  this.fields.forEach(function(fld) {
    if(fld[0].toLowerCase() != "include") return;
    includes.push(fld[1]);
  });
  this.includes = new RegExp(includes.map(urlglob2regexp).join('|'), 'i');
  //console.log(JSON.stringify(includes), '=>', this.includes.source);
};

ScriptInfo.prototype.toJSON = function() {
  return [this.scriptName,this.fields];
};

ScriptInfo.prototype.wantsJQuery = function() {
  return this.fields.some(function(fld){
    //console.log(fld, fld[0].toLowerCase()=='grant', fld[1].split(/\s+/).indexOf('jQuery')>=0);
    return fld[0].toLowerCase()=='grant' && fld[1].split(/\s+/).indexOf('jQuery')>=0;
  });
};

var r_open = /==UserScript==/i;
var r_close = /==\/UserScript==/i;
var r_key = /@([a-z-]+)(?:\s+(.*))?/i;
ScriptInfo.prototype.parse = function() {
  if(this.fields !== null) return this;
  if(acorn === null) acorn = require('acorn');
  var comments = [], tokens = [];
  var scriptPath = path.resolve(baseDir, this.scriptName);
  var ast = acorn.parse(this.readSync(), {
      onComment: comments,
      sourceFile: this.scriptName
  });

  var state = 0, fields = [];
  function commentLine(s) {
    if(state==2) return;
    if(state==0) {
      if(r_open.test(s))
        state = 1;
      return;
    }
    if(r_close.test(s)) {
      state = 2;
      return;
    }
    var m = r_key.exec(s);
    if(m !== null) {
      fields.push([m[1], m[2]]);
    }
  }
  comments.forEach(function(comm){
    if(state==2) return;
    if(comm.type.toLowerCase() == "block")
      comm.value.split('\n').forEach(commentLine);
    else
      commentLine(comm.value);
  });
  this.initFields(fields);
  return this;
};

ScriptInfo.prototype.reload = function() {
  this.fields = null;
  return this.parse();
};

ScriptInfo.prototype.readSync = function() {
  if(this.script !== null) return this.script;
  var scriptPath = path.resolve(baseDir, this.scriptName);
  this.script = fs.readFileSync(scriptPath,{encoding:'utf8'});
  return this.script;
};

function reload() {
  return scripts.map(function(si) { return si.reload(); });
}

function url2scriptinfo(url) {
  return scripts.map(function(si) { return si.parse(); }).filter(function(si) { return si.includes.test(url); });
}

function url2scripts(url) {
  return url2scriptinfo(url).map(function(si) { si.scriptName; });
}

function url2scriptdata(url) {
  return url2scriptinfo(url).map(function(si) { si.readSync(); });
}

function ensureScriptInfo(script) {
  if(ScriptInfo.prototype.isPrototypeOf(script))
    return script;
  if(util.isArray(script) && script.length == 2 && util.isArray(script[1]))
    new ScriptInfo(script[0], script[1]);
  return new ScriptInfo(script);
}

exports.ScriptInfo = ScriptInfo;
exports.ensureScriptInfo = ensureScriptInfo;
var scripts;
try {
  exports.scripts = scripts = require('./scripts-data.json').map(function(row) { return new ScriptInfo(row[0], row[1]); });
} catch(e) {
  console.warn("Can't load scripts-data.json, please run genscripts.js");
  console.trace(e);
  scripts = null;
}

if(scripts !== null) {
  exports.url2scriptinfo = url2scriptinfo;
  exports.url2scripts = url2scripts;
  exports.url2scriptdata = url2scriptdata;
  exports.reload = reload;
}
