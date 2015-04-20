// ==UserScript==
// @id             event-bigbilet@pyhedgehog.github.com
// @name           event enricher for bigbilet.ru
// @version        1.2
// @homepageURL    https://github.com/pyhedgehog/microformat-userjs/
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
  var count = 0;
  var w = window;
  if(typeof unsafeWindow != 'undefined') {
    w = unsafeWindow;
  }
  if(window.document.readyState != 'complete') {
    return window.setTimeout(mfEnrichBigBiletEventMain,1000);
  }
  var events;
  if(typeof w.events != 'undefined') {
    events = w.events;
    w.console.log('event-bigbilet.user.js: Found events var: '+events.length+'; 0.id='+events[0].id);
  } else {
    var o = Array.prototype.filter.call(window.document.getElementsByTagName('script'), function(elem) {
        if(elem.innerHTML.match(/^\s*events\s*=\s*\[/)) { return elem; }
      });
    if(o.length!=1) {
      w.console.error('event-bigbilet.user.js: Failed to find single events script: '+o.length);
      return;
    }
    //eval(o[0].innerHTML);
    events = o[0].innerHTML;
    //w.console.log('innerHTML = '+events);
    events = events.substr(events.indexOf('=')+1).trim();
    if(events.endsWith(';')) {
      events = events.substr(0,events.length-1).trimRight();
    }
    //w.console.log('substr = '+events);
    events = JSON.parse(events);
    //w.console.log(events);
    w.console.log('event-bigbilet.user.js: Found events script: '+events.length+'; 0.id='+events[0].id);
  }
  function processEventObject(event) {
    var tools={};
    tools.add_u_attach = function(elem) { elem.className += ' attach u-attach'; return elem; };
    tools.add_u_url = function(elem) { elem.className += ' url u-url'; return elem; };
    tools.add_p_summary = function(elem) { elem.className += ' summary p-summary'; return elem; };
    tools.add_p_summary_and_url = function(elem) {
      Array.prototype.forEach.call(elem.getElementsByTagName('a'), tools.add_u_url);
      return tools.add_p_summary(elem);
    };
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
      if(txt !== null) {
        var span = w.document.createElement('span');
        span.className = 'value';
        span.style['font-weight'] = 'bold';
        txt.splitText(txt.data.indexOf(event.serviceName)+event.serviceName.length);
        span.appendChild(par.replaceChild(span, txt));
      }
      return tools.add_p_summary_and_url(elem);
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
      return elem;
    };
    var elem = window.document.getElementById('ev'+event.id);
    if(!elem) { return; }
    count += 1;
    elem.className += ' vevent h-event';
    Array.prototype.forEach.call(elem.getElementsByClassName('ev-name'), tools.add_p_summary_split_value);
    Array.prototype.forEach.call(elem.getElementsByClassName('imgener'), tools.find_attach_img);
    Array.prototype.forEach.call(elem.getElementsByClassName('ev-date'), tools.fill_dt_start);
    var advinfoElem = window.document.createElement('span');
    advinfoElem.setAttribute('style', 'display:none');
    var advinfo = '';
    advinfo += '<span class="location p-location">';
    advinfo += '<span class="vcard h-card">';
    //advinfo += '<span class="geo h-geo"><span class="latitude p-latitude">'+event.latitude+'</span>, '+
    //           '<span class="longitude p-longitude">'+event.longitude+'</span></span> - ';
    advinfo += '<span class="adr h-adr"><span class="locality p-locality">'+event.city+'</span>, ';
    advinfo += '<span class="street-address p-street-address">'+(event.companyAddress.replace(event.city+', ',''))+'</span></span>';
    advinfo += ' (<span class="name p-name">'+event.longCompanyName+'</span>)';
    advinfo += '</span>'; // vcard
    advinfo += '</span>'; // location
    advinfo += '<span class="description p-description">'+event.serviceType+'<br/>\n'+event.serviceName;
    advinfo += '<br/>\nPrice: '+event.minPrice+'-'+event.maxPrice+'</span>';
    var edt = new Date(event.endDate).toLocaleFormat('%Y-%m-%d %H:%M:%S');
    advinfo += '<span class="dtend dt-end" datetime="'+edt+'" title="'+edt+'">'+edt+'</span>';
    advinfoElem.innerHTML = advinfo;
    elem.appendChild(advinfoElem);
    //var ev = new Event('DOMNodeInserted',{'bubbles':true});
    //elem.dispatchEvent(ev);
    var ev = window.document.createEvent('MutationEvents');
    ev.initMutationEvent('DOMNodeInserted', true, false, elem, null, null, null, null);
    elem.dispatchEvent(ev);
    return elem;
  }
  Array.prototype.forEach.call(events, processEventObject);
  //var p = '<p><a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">'+
  //        'Handled by event-bigbilet microformat enricher (found '+count+' events).</a></p>';
  //window.document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend',p);
  return count*3; // vevent+vcard+adr
})();
