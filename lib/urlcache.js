#!/usr/bin/env node
//var path = require('path');
var crypto = require('crypto');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var sqlite3 = require('sqlite3');
var Promise = require('q').Promise;

var APPLID = 0x6d666a73;
var SCHEMA = 'create table if not exists urlcache (url text primary key, data text)';
var UPGRADES = {
  1698259510:'alter table url_cache rename to urlcache'
//  1634021682:''
};
var DBVER = new Buffer(crypto.createHash('md5').update(SCHEMA).digest('hex'), {encoding:'hex'}).readInt32BE();
var okdbver = new Set([0,DBVER]);
Object.keys(UPGRADES).forEach(function(v){okdbver.add(parseInt(v));});
//console.log('DBVER ', DBVER, okdbver.has(DBVER));
var okdbverlist=[];okdbver.forEach(function(v){okdbverlist.push(v);});
console.log('okdbverlist ', okdbverlist);

function SqliteCache(dbfn) {
  if(!dbfn) {
    if(require.main)
      dbfn = require.main.filename.replace(/\.js$/, '.db');
    else
      dbfn = module.filename.replace(/\.js$/, '.db');
  }
  this.error = this.db = this.cached = null;
  this.db = new sqlite3.Database(dbfn, 'r+');
  this.db.on('error', this._db_onerror.bind(this));
  var self = this;
  new Promise(function(cb) { self.check_applid(cb); })
  .then(function(applid) {
    new Promise(function(cb) { self.check_dbver(cb); })
    .then(function() {
      this.fetch_list(function() { self.emit('ready'); });
    });
  });
}

util.inherits(SqliteCache, EventEmitter);

SqliteCache.prototype.isReady = function() {
  return !this.db || !!this.cached;
};

SqliteCache.prototype.ready = function(cb, fb) {
  if(!this.db) {
    if(fb) fb(this.error);
    return this;
  }
  if(this.cached) {
    if(cb) cb();
    return this;
  }
  var self = this;
  this.once('ready', function() {
    self.removeListener('end', onerror);
    if(cb) cb();
  }).once('end', onerror);
  function onerror() {
    if(fb) fb(self.error);
  }
  return this;
};

SqliteCache.prototype._db_onerror = function(err) {
  this.error = err;
  this.db.close();
  this.db = null;
  this.emit('end'); 
};

SqliteCache.prototype.check_applid = function(cb) {
  this.db.all('pragma application_id', this._applid_get.bind(this, cb));
};

SqliteCache.prototype._applid_get = function(cb, err, rows) {
  if(err) return this._db_onerror(err);
  //console.log('application_id', rows[0].application_id);
  if(rows[0].application_id!==0&&rows[0].application_id!=APPLID) {
    this._db_onerror(new Error('Invalid DB id: '+rows[0].application_id));
    return;
  }
  var applid = rows[0].application_id;
  //console.log('applid', applid);
  if(applid===0)
    return this.db.run('pragma application_id('+APPLID+')', this._applid_put.bind(this, cb, applid));
  return this._applid_put(cb, applid);
};

SqliteCache.prototype._applid_put = function(cb, applid, err) {
  if(err) return this._db_onerror(err);
  return cb();
};

SqliteCache.prototype.check_dbver = function(cb) {
  this.db.all('pragma user_version', this._dbver_get.bind(this, cb));
};

SqliteCache.prototype._dbver_get = function(cb, err, rows) {
  if(err) return this._db_onerror(err);
  //console.log('user_version', rows, okdbver.has(rows[0].user_version));
  if(!okdbver.has(rows[0].user_version))
    return this._db_onerror(new Error('Invalid DB version: '+rows[0].user_version));
  var dbver = rows[0].user_version;
  //console.log('dbver', dbver);
  var onddl = this._dbver_ddl.bind(this, cb);
  if(dbver===0) {
    //console.log('SCHEMA');
    this.db.exec(SCHEMA, onddl);
  } else if(dbver!=DBVER) {
    //console.log('UPGRADES['+dbver+']');
    this.db.exec(UPGRADES[dbver], onddl);
  } else
    this._applid_put(cb);
};

SqliteCache.prototype._dbver_ddl = function(cb, err, rows) {
  if(err) return this._db_onerror(err);
  this.db.run('pragma user_version('+DBVER+')', this._dbver_put.bind(this, cb));
};

SqliteCache.prototype._dbver_put = function(cb, err) {
  if(err) return this._db_onerror(err);
  return cb();
};

SqliteCache.prototype.fetch_list = function(cb) {
  this.db.all('select url from urlcache', this._list_get.bind(this, cb));
};

SqliteCache.prototype._list_get = function(cb, err, rows) {
  if(err) return this._db_onerror(err);
  var cached = new Set();
  rows.forEach(function(row) { cached.add(row.url); });
  this.cached = cached;
  cb();
};

SqliteCache.prototype.get = function(url, cb, fb) {
  this.db.all('select data from urlcache where url=?', [url], function(err, rows) {
    if(fb) {
      if(err) return fb(err);
      if(rows.length===0) return fb();
    }
    return cb(err, rows[0].data);
  });
};

SqliteCache.prototype.put = function(url, data, cb, fb) {
  this.cached.add(url);
  this.db.run('insert or replace into urlcache (url,data) values (?,?)', [url, data], function(err) {
    if(err&&fb) return fb(err);
    return cb();
  });
};

exports.SqliteCache = SqliteCache;
exports.DBVER = DBVER;
