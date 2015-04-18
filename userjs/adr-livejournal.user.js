/*
==UserScript==
@id             adr-livejournal@pyhedgehog.github.com
@name           adr enricher for livejournal users
@version        1.2
@homepage       https://github.com/pyhedgehog/microformat-userjs/
@namespace      https://github.com/pyhedgehog/microformat-userjs/
@author         Michael P. Dubner <pywebmail@mail.ru> http://pyhedgehog.livejorunal.com/
@description    Example of userscript enriching livejournal site with adr microformat (using plain DOM)
@include        *://*.livejournal.com/*
@run-at         document-end
==/UserScript==
*/
(function() {
  var count=0;
  var tools={};
  tools.add_locality = function(elem) { elem.className += ' locality p-locality'; return elem; };
  tools.add_adr = function(elem) {
    count+=1;
    // we adding top-level class of adr microformat
    elem.className += ' adr h-adr';
    Array.prototype.map.call(elem.getElementsByTagName('a'), tools.add_locality);
    // then we triggering DOMNodeInserted for all top-level elements of microformat
    // so Operator (or other microformat-parsing addon) can catch our changes.
    //var ev = new Event('DOMNodeInserted',{'bubbles':true});
    //elem.dispatchEvent(ev);
    var ev = window.document.createEvent('MutationEvents');
    ev.initMutationEvent('DOMNodeInserted', true, false, elem, null, null, null, null);
    elem.dispatchEvent(ev);
    return elem;
  };
  tools.add_adr_check_href = function(elem) {
    Array.prototype.map.call(elem.getElementsByTagName('a'),
        function(elem) {
          if(elem.href.toLowerCase().indexOf('maps')>=0) {
            tools.add_adr(elem.parentNode);
          }
          return elem;
        });
    return elem;
  };
  // add adr to profile location field
  Array.prototype.map.call(window.document.getElementsByClassName('b-profile-group-geo'), tools.add_adr);
  // add adr to post location field for several LJ-styles
  Array.prototype.map.call(window.document.getElementsByClassName('metadata-location'), tools.add_adr);
  Array.prototype.map.call(window.document.getElementsByClassName('p-location'), tools.add_adr);
  Array.prototype.map.call(window.document.getElementsByClassName('lj-currents'), tools.add_adr_check_href);
  var p = window.document.createElement('p');
  p.innerHTML = '<a href="https://github.com/pyhedgehog/microformat-userjs" rel="nofollow">'+
                'Handled by adr-livejournal microformat enricher (found '+count+' locations).</a>';
  window.document.getElementsByTagName('body')[0].appendChild(p);
  return count;
})();
