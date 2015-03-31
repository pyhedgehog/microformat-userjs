if(!(new Date()).toLocaleFormat) {
  Date.prototype.toLocaleFormat = function(format) {
    function zfill2(n) { return n < 10 ? "0" + n : n; }
    function zfill3(n) { return n < 10 ? "00" + n : n < 100 ? "0" + n : n; }
    function dtgetter(func) { return function(dt) { return Date.prototype[func].call(dt); }; }
    function dtgetter2(func) { return function(dt) { return zfill2(Date.prototype[func].call(dt)); }; }
    var f = {
      Y:dtgetter('getFullYear'),
      y:dtgetter2('getYear'),
      d:dtgetter2('getDate'),
      H:dtgetter2('getHours'),
      M:dtgetter2('getMinutes'),
      S:dtgetter2('getSeconds'),
      x:function(dt){ return dt.toLocaleDateString(); },
      I:function(dt){ return zfill2(dt.getHours()%12); },
      m:function(dt){ return zfill2(dt.getMonth()+1); },
      j:function(dt){ return zfill3(Math.floor((dt-(new Date(dt.getFullYear()+'/01/01')))/86400000)); },
      p:function(dt){ return ["AM","PM"][Math.floor(dt.getHours()/12)]; },
      a:function(dt){ return ["Sun","Mon","Tue","Wed","Tru","Fri","Sat"][dt.getDay()]; },
      A:function(dt){ return ["Sunday","Monday","Tuesday","Wednesday","Trursday","Friday","Saturday"][dt.getDay()]; },
      b:function(dt){ return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dt.getMonth()]; },
      B:function(dt){ return ["January","Februry","March","April","May","June","July","August","September","October","November","December"][dt.getMonth()]; },
      z:function(dt){ return dt.toTimeString().split('(')[1].split(')')[0]; },
      c:function(dt){ return dt.toLocaleString(undefined,{hour12:false}); },
      X:function(dt){ return dt.toLocaleTimeString(undefined,{hour12:false}); }
    };
    f.Z = f.z;
    if(!format) format = '%A, %B %d, %Y %H:%M:%S';
    for(var k in f)
      format = format.replace('%' + k, f[k](this));
    var i=format.replace('%%','').indexOf('%');
    if(i>=0) return this.toString(); // fallback to toString if unknown format found
    return format.replace('%%','%');
  };
}

if (![].includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    'use strict';
    if(typeof this.indexOf === "function")
      return this.indexOf(searchElement, fromIndex)>=0;
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}

function copy(obj) {
  var res={};
  for(var p in obj) res[p] = obj[p];
  return res;
}

exports.copy = copy;
