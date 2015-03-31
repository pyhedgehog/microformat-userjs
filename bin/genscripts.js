#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var ScriptInfo = require('../lib/scriptsregistry').ScriptInfo;
var baseDir = path.dirname(path.dirname(module.filename));
var scripts = fs.readdirSync(baseDir).filter(function(fn){return fn.substr(fn.length-8)=='.user.js';});

scripts = scripts.map(function(script) {
  return new ScriptInfo(script).parse();
});

var output = path.resolve(baseDir, 'lib', 'scripts-data.json');
fs.writeFileSync(output, JSON.stringify(scripts, null, 2), {encoding:'utf8'});
