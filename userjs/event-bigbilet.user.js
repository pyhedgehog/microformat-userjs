// ==UserScript==
// @id             event-bigbilet@pyhedgehog.github.com
// @name           event enricher for bigbilet.ru
// @version        1.2
// @homepageURL    https://github.com/pyhedgehog/microformat-userjs/wiki/BigBilet_hCalendar
// @namespace      https://github.com/pyhedgehog/microformat-userjs/
// @downloadURL    https://raw.githubusercontent.com/pyhedgehog/microformat-userjs/master/userjs/event-bigbilet.user.js
// @updateURL      https://pyhedgehog.github.io/microformat-userjs/userjs/event-bigbilet.user.js
// @author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejournal.com/
// @description    Userscript enriching bigbilet site with event microformat
// @include        *://bigbilet.ru/*
// @run-at         document-end
// @grant          unsafeWindow
// @grant          console
// ==/UserScript==
(function mfEnrichBigBiletEventMain() {
  //if(window.top !== window) { return 0; }
  var count = 0;
  var countAll = 0;
  var arr;
  var w = window;
  if(typeof unsafeWindow !== 'undefined') {
    w = unsafeWindow;
  }
  if(window.document.readyState !== 'complete') {
    //w.console.log('event-bigbilet.user.js: window.document.readyState = '+window.document.readyState);
    return window.setTimeout(mfEnrichBigBiletEventMain,1000);
  }
  var events = null;
  if(typeof w.events !== 'undefined') {
    //w.console.log('event-bigbilet.user.js: found events object');
    events = w.events;
    //w.console.log('event-bigbilet.user.js: Found events var: '+events.length+'; 0.id='+events[0].id);
  } else {
    //w.console.log('event-bigbilet.user.js: searching events script '+window.document.location.pathname);
    arr = [];
    Array.prototype.forEach.call(window.document.getElementsByTagName('script'), function(elem) {
        var matchArr = /^\s*events\s*=\s*(\[[^;]*\]);/.exec(elem.innerHTML);
        if(matchArr) { arr.push(matchArr[1]); }
      });
    //w.console.log('event-bigbilet.user.js: arr1 = '+arr);
    if(arr.length === 1) {
      //eval('events = '+arr[0]);
      events = arr[0];
      //w.console.log('event-bigbilet.user.js: events = '+events);
      events = JSON.parse(events);
      //w.console.log(events);
      //w.console.log('event-bigbilet.user.js: Found events script: '+events.length+'; 0.id='+events[0].id);
    }
  }
  if(events === null) {
    //w.console.log('event-bigbilet.user.js: searching event script '+window.document.location.pathname);
    arr = [];
    Array.prototype.forEach.call(window.document.getElementsByTagName('script'), function(elem) {
        var matchArr = /\sevent\s*=\s*({[^;]*})\s*;/.exec(elem.innerHTML);
        //w.console.log('event-bigbilet.user.js: script = '+elem.innerHTML.substr(1,30));
        if(matchArr) { arr.push(matchArr[1]); }
      });
    //w.console.log('event-bigbilet.user.js: arr2 = '+arr);
    if(arr.length === 1) {
      //eval('events = ['+arr[0]+']');
      events = arr[0];
      //w.console.log('event-bigbilet.user.js: event = '+events);
      events = [JSON.parse(events)];
      //w.console.log(events);
      //w.console.log('event-bigbilet.user.js: Found event script: '+events[0].id);
    }
  }
  if(events !== null) {
    Array.prototype.forEach.call(events, processEventObject);
  }
  //var p = '<p><a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">'+
  //        'Handled by event-bigbilet microformat enricher (found '+count+' events).</a></p>';
  //window.document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend',p);
  return countAll;
  function processEventObject(event) {
    var dtstartFound = false;
    var tools={};
    tools.add_u_attach = function(elem) { elem.className += ' attach u-attach'; return elem; };
    tools.add_u_url = function(elem) { elem.className += ' url u-url'; return elem; };
    tools.add_p_summary = function(elem) { elem.className += ' summary p-summary'; return elem; };
    tools.add_p_summary_split_value = function(elem) {
      var prev = w.document.documentElement;
      var par = elem;
      var txt = null;
      var i;
      while(txt === null && par !== prev) {
        prev = par;
        for(i=0; i<par.childNodes.length; i++) {
          var child = par.childNodes[i];
          if(child.nodeType == child.TEXT_NODE) {
            if(child.data.indexOf(event.serviceName)>=0) {
              txt = child;
              continue;
            }
          } else if(child.textContent.indexOf(event.serviceName)>=0) {
            par = child;
            break;
          }
        }
      }
      var span;
      if(txt !== null) {
        span = w.document.createElement('span');
        //span.className = 'value';
        span.style['font-weight'] = 'bold';
        txt.splitText(txt.data.indexOf(event.serviceName)+event.serviceName.length);
        span.appendChild(par.replaceChild(span, txt));
      }
      Array.prototype.forEach.call(elem.getElementsByTagName('a'), tools.add_u_url);
      tools.add_p_summary(span ? span : elem);
      return elem;
    };
    tools.find_attach_img = function(elem) {
      Array.prototype.forEach.call(elem.getElementsByTagName('img'), tools.add_u_attach);
      return elem;
    };
    tools.fill_dt_start = function(elem) {
      elem.className += ' dtstart dt-start';
      var sdt = new Date(event.startDate).toLocaleFormat('%Y-%m-%d %H:%M:%S');
      elem.setAttribute('datetime', sdt);
      elem.setAttribute('title', sdt);
      dtstartFound = true;
      return elem;
    };
    tools.advinfo_location = function() {
      var advinfo = '<span class="location p-location">';
      advinfo += '<span class="vcard h-card">';
      //advinfo += '<span class="geo h-geo"><span class="latitude p-latitude">'+event.latitude+'</span>, '+
      //           '<span class="longitude p-longitude">'+event.longitude+'</span></span> - ';
      advinfo += '<span class="adr h-adr"><span class="locality p-locality">'+event.city+'</span>, ';
      advinfo += '<span class="street-address p-street-address">'+(event.companyAddress.replace(event.city+', ',''))+'</span></span>';
      advinfo += ' (<span class="name p-name">'+event.longCompanyName+'</span>)';
      advinfo += '</span>'; // vcard
      advinfo += '</span>'; // location
      return advinfo;
    };
    tools.advinfo_description = function() {
      var advinfo = '<span class="description p-description">'+event.serviceType+'<br/>\n'+event.serviceName;
      advinfo += '<br/>\nPrice: '+event.minPrice+'-'+event.maxPrice+'</span>';
      return advinfo;
    };
    tools.advinfo_url = function() {
      return '<a class="url u-url" href="'+window.document.location.href+'">'+window.document.location.href+'</a>';
    };
    tools.advinfo_dtstart = function() {
      var sdt = new Date(event.startDate).toLocaleFormat('%Y-%m-%d %H:%M:%S');
      return '<span class="dtstart dt-start" datetime="'+sdt+'" title="'+sdt+'">'+sdt+'</span>';
    };
    tools.advinfo_dtend = function() {
      var edt = new Date(event.endDate).toLocaleFormat('%Y-%m-%d %H:%M:%S');
      return '<span class="dtend dt-end" datetime="'+edt+'" title="'+edt+'">'+edt+'</span>';
    };
    var elem = window.document.getElementById('ev'+event.id);
    var advinfo = '';
    if(!elem) {
      var elems = window.document.getElementsByClassName('all-about-event');
      //w.console.log('event-bigbilet.user.js: all-about-event = '+elems.length);
      if(elems.length === 1) {
        var names = elems[0].getElementsByClassName('ev-name');
        //w.console.log('event-bigbilet.user.js: all-about-event[0] = '+names[0].firstChild.textContent+' '+
        //              (names[0].firstChild.textContent == event.serviceName));
        if(names.length === 1 && names[0].firstChild.textContent == event.serviceName) {
          elem = elems[0];
          var pushElem = window.document.createElement('span');
          pushElem.className = 'push';
          elem.insertBefore(pushElem, elem.firstChild);
          var i = 0;
          while(pushElem.nextSibling !== null) {
            elem = pushElem.nextSibling;
            if(elem.classList && elem.classList.contains('clear')) { break; }
            pushElem.appendChild(elem);
            i += 1;
          }
          //w.console.log('event-bigbilet.user.js: pushed '+i+' elements.');
          elem = pushElem;
          advinfo += tools.advinfo_dtstart();
          advinfo += tools.advinfo_url();
        }
      }
    }
    //w.console.log('event-bigbilet.user.js: elem = '+elem);
    if(!elem) { return; }
    count += 1;
    countAll += 3; // vevent+vcard+adr
    elem.className += ' vevent h-event';
    //w.console.log('event-bigbilet.user.js: ev-name = '+elem.getElementsByClassName('ev-name').length);
    Array.prototype.forEach.call(elem.getElementsByClassName('ev-name'), tools.add_p_summary_split_value);
    //w.console.log('event-bigbilet.user.js: imgener = '+elem.getElementsByClassName('imgener').length);
    Array.prototype.forEach.call(elem.getElementsByClassName('imgener'), tools.find_attach_img);
    //w.console.log('event-bigbilet.user.js: ev-date = '+elem.getElementsByClassName('ev-date').length);
    Array.prototype.forEach.call(elem.getElementsByClassName('ev-date'), tools.fill_dt_start);
    var advinfoElem = window.document.createElement('span');
    advinfoElem.setAttribute('style', 'display:none');
    advinfo += tools.advinfo_location();
    advinfo += tools.advinfo_description();
    advinfo += tools.advinfo_dtend();
    advinfoElem.innerHTML = advinfo;
    elem.appendChild(advinfoElem);
    //var ev = new Event('DOMNodeInserted',{'bubbles':true});
    //elem.dispatchEvent(ev);
    var ev = window.document.createEvent('MutationEvents');
    ev.initMutationEvent('DOMNodeInserted', true, false, elem, null, null, null, null);
    elem.dispatchEvent(ev);
    return elem;
  }
})();
