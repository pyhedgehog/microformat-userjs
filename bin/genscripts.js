#!/usr/bin/env node
var fs = require('fs');
var url = require('url');
var path = require('path');
var child_process = require('child_process');
var request = require('request');
var copy = require('../lib/nodesupport').copy;
var ScriptInfo = require('../lib/scriptsregistry').ScriptInfo;
var rootDir = path.dirname(path.dirname(module.filename));
var baseDir = path.resolve(rootDir, 'userjs');
var scripts = fs.readdirSync(baseDir).filter(function(fn) {
  return fn.substr(fn.length-8)=='.user.js';
});
var localcfg = null;
try { localcfg = require('../local.json'); } catch (e) {}

console.log('genscripts: Parsing userjs...');
scripts = scripts.map(function(script) {
  return new ScriptInfo(script).parse();
});

console.log('genscripts: Writing cache...');
var output = path.resolve(rootDir, 'lib', 'scripts-data.json');
fs.writeFileSync(output, JSON.stringify(scripts, null, 2), {encoding:'utf8'});

if(localcfg&&localcfg.web) {
  var fldLengths = [];
  ScriptInfo.prototype.knownFieldNames.forEach(function(s) { fldLengths.push(s.length); });
  var maxFldLength = Math.max.apply(null,fldLengths);
  console.log('genscripts: Writing meta...');
  scripts.forEach(function(si) {
    var fn = path.resolve(rootDir, localcfg.web, 'userjs', si.scriptName.replace('.user.js','.meta.js'));
    var s = si.fields.map(function(fld) { return '// '+fld[0]+(' ').repeat(maxFldLength+2-fld[0].length)+fld[1]; }).join('\n')+'\n';
    fs.writeFileSync(fn, s, {encoding:'utf8'});
  });
  var docs = null;
  if(localcfg.wiki) {
    var wiki = path.resolve(rootDir, localcfg.wiki);
    var fetch = fs.statSync(path.resolve(wiki, '.git', 'FETCH_HEAD'));
    if((new Date).valueOf()-fetch.mtime.valueOf()>600000) { // 10 minutes
      console.log('genscripts: Updating wiki git...');
      child_process.spawnSync('git', ['pull'], {cwd:wiki});
    }
    console.log('genscripts: Parsing wiki...');
    var reWiki = /\(https:\/\/raw\.githubusercontent\.com\/pyhedgehog\/microformat-userjs\/master\/(.*\.user\.js)\)/g;
    var wikiScripts = [];
    fs.readdirSync(wiki).filter(function(fn) { return fn.slice(-3)=='.md'; })
      .map(function(fn) { return [path.basename(fn, '.md'), fs.readFileSync(path.resolve(wiki, fn), {encoding:'utf8'})]; })
      .forEach(function(doc) {
        var m = [];
        var fn = doc[0];
        doc = doc[1];
        while((m = reWiki.exec(doc)) != null) {
          //console.log(fn+'.md: script='+m[1]);
          wikiScripts.push([fn, m[1]]);
        }
      });
    docs = scripts.filter(function(si) {
      var doc = getHomepage(si);
      var wikiName = wikiScripts.filter(function(a) { return a[1]===si.scriptName; });
      if(wikiName.length === 0) {
        wikiName = null;
      } else {
        wikiName = wikiName[0][0];
      }
      if(doc !== null) {
        doc = path.basename(url.parse(doc).path);
      }
      //console.log(si.scriptName+': homepageURL='+doc+'; wikiName='+wikiName);
      if(wikiName === null) {
        if(doc === null) {
          console.log(si.scriptName+': no homepageURL');
        }
        return false;
      } else if(wikiName !== doc) {
        console.log(si.scriptName+': homepageURL should be updated to https://github.com/pyhedgehog/microformat-userjs/wiki/'+wikiName);
      }
      return true;
    }).length;
    console.log('genscripts: wiki docs='+docs);
  }
  if(docs === null) {
    docs = scripts.filter(function(si) {
      var doc = getHomepage(si);
      if(doc === null) {
        console.log(si.scriptName+': no homepageURL');
        return false;
      }
      console.log(si.scriptName+': homepageURL = '+doc);
      return doc !== 'https://github.com/pyhedgehog/microformat-userjs/';
    }).length;
    console.log('genscripts: userjs docs='+docs);
  }
  var reqcfg = {};
  if(localcfg.proxy) {
    reqcfg.proxy = localcfg.proxy;
  } else if(process.env.https_proxy) {
    reqcfg.proxy = process.env.https_proxy;
  }
  var cfg;
  cfg = copy(reqcfg);
  cfg.url = 'https://img.shields.io/badge/install-'+scripts.length+'-green.svg';
  console.log('genscripts: Downloading install.svg (install-'+scripts.length+'-green.svg)...');
  request.get(cfg, saveRequest.bind(null, path.resolve(rootDir, localcfg.web, 'images', 'install.svg')));
  cfg = copy(reqcfg);
  cfg.url = 'https://img.shields.io/badge/docs-'+docs+'%2F'+scripts.length+'-green.svg';
  console.log('genscripts: Downloading docs.svg (docs-'+docs+'%2F'+scripts.length+'-green.svg)...');
  request.get(cfg, saveRequest.bind(null, path.resolve(rootDir, localcfg.web, 'images', 'docs.svg')));
}
console.log('genscripts: Done.');

function saveRequest(fn, err, res, responseText) {
  if(err) {
    console.error(err);
    return;
  }
  try {
    fs.writeFileSync(fn, responseText);
  } catch (e) {
    console.trace(e);
  }
}

function getHomepage(si) {
  var doc = si.fields.filter(function(fld) { return fld[0] === 'homepageURL'; });
  if(doc.length === 0) { return null; }
  return doc[0][1];
}
