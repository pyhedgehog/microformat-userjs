//var EXPORTED_SYMBOLS = ['Microformats', 'adr', 'tag', 'hCard', 'hCalendar', 'geo'];

var XPathResultTypes;
if(typeof Components === 'undefined') {
  XPathResultTypes = {
    ANY_TYPE: 0,
    NUMBER_TYPE: 1,
    STRING_TYPE: 2,
    BOOLEAN_TYPE: 3,
    UNORDERED_NODE_ITERATOR_TYPE: 4,
    ORDERED_NODE_ITERATOR_TYPE: 5,
    UNORDERED_NODE_SNAPSHOT_TYPE: 6,
    ORDERED_NODE_SNAPSHOT_TYPE: 7,
    ANY_UNORDERED_NODE_TYPE: 8,
    FIRST_ORDERED_NODE_TYPE: 9
  };
} else {
  XPathResultTypes = Components.interfaces.nsIDOMXPathResult;
}

var Microformats = {
  /* When a microformat is added, the name is placed in this list */
  list: [],
  /* Custom iterator so that microformats can be enumerated as */
  /* for(i in Microformats) */
  /*__iterator__: function() {
    for(var i=0; i < this.list.length; i++) {
      yield this.list[i];
    }
  },*/
  forEach: function(_cb) {
    for(var i=0; i < this.list.length; i++) {
      _cb(this.list[i], i);
    }
  },
  /**
   * Retrieves microformats objects of the given type from a document
   *
   * @param  name          The name of the microformat (required)
   * @param  rootElement   The DOM element at which to start searching (required)
   * @param  options       Literal object with the following options:
   *                       recurseExternalFrames - Whether or not to search child frames
   *                       that reference external pages (with a src attribute)
   *                       for microformats (optional - defaults to true)
   *                       showHidden -  Whether or not to add hidden microformat
   *                       (optional - defaults to false)
   *                       debug - Whether or not we are in debug mode (optional
   *                       - defaults to false)
   * @param  targetArray  An array of microformat objects to which is added the results (optional)
   * @return A new array of microformat objects or the passed in microformat
   *         object array with the new objects added
   */
  get: function(name, rootElement, options, targetArray) {
    var i;
    function isAncestor(haystack, needle) {
      var parent = needle;
      while(parent && (parent = parent.parentNode)) {
        /* We need to check parentNode because defaultView.frames[i].frameElement */
        /* isn't a real DOM node */
        if(parent == haystack.parentNode) {
          return true;
        }
      }
      return false;
    }
    if(!Microformats[name] || !rootElement) {
      return undefined;
    }
    targetArray = targetArray || [];

    /* Root element might not be the document - we need the document's default view */
    /* to get frames and to check their ancestry */
    var defaultView = rootElement.defaultView ||
                      rootElement.ownerDocument.defaultView;
    var rootDocument = rootElement.ownerDocument || rootElement;

    /* If recurseExternalFrames is undefined or true, look through all child frames for microformats */
    if(!options || !options.hasOwnProperty('recurseExternalFrames') || options.recurseExternalFrames) {
      if(defaultView && defaultView.frames.length > 0) {
        for(i=0; i < defaultView.frames.length; i++) {
          if(isAncestor(rootDocument, defaultView.frames[i].frameElement)) {
            Microformats.get(name, defaultView.frames[i].document, options, targetArray);
          }
        }
      }
    }

    /* Get the microformat nodes for the document */
    var microformatNodes = [];
    if(Microformats[name].className) {
      microformatNodes = Microformats.getElementsByClassName(rootElement,
                                        Microformats[name].className);
      /* alternateClassName is for cases where a parent microformat is inferred by the children */
      /* If we find alternateClassName, the entire document becomes the microformat */
      if((microformatNodes.length === 0) && Microformats[name].alternateClassName) {
        var altClass = Microformats.getElementsByClassName(rootElement, Microformats[name].alternateClassName);
        if(altClass.length > 0) {
          microformatNodes.push(rootElement);
        }
      }
    } else if(Microformats[name].attributeValues) {
      microformatNodes =
        Microformats.getElementsByAttribute(rootElement,
                                            Microformats[name].attributeName,
                                            Microformats[name].attributeValues);
    }

    function isVisible(node, checkChildren) {
      var box;
      if(node.getBoundingClientRect) {
        box = node.getBoundingClientRect();
        /* Firefox 3.1 defined box.width/height */
        if(box.width === undefined) {
          box.width = box.right - box.left;
          box.height = box.bottom - box.top;
        }
      } else {
        box = node.ownerDocument.getBoxObjectFor(node);
      }
      /* If the parent has is an empty box, double check the children */
      if((box.height === 0) || (box.width === 0)) {
        if(checkChildren && node.childNodes.length > 0) {
          for(var i=0; i < node.childNodes.length; i++) {
            if(node.childNodes[i].nodeType == node.ELEMENT_NODE) {
              /* For performance reasons, we only go down one level */
              /* of children */
              if(isVisible(node.childNodes[i], false)) {
                return true;
              }
            }
          }
        }
        return false;
      }
      return true;
    }

    /* Create objects for the microformat nodes and put them into the microformats */
    /* array */
    for(i = 0; i < microformatNodes.length; i++) {
      /* If showHidden undefined or false, don't add microformats to the list that aren't visible */
      if(!options || !options.hasOwnProperty('showHidden') || !options.showHidden) {
        if(microformatNodes[i].ownerDocument) {
          if(!isVisible(microformatNodes[i], true)) {
            continue;
          }
        }
      }
      try {
        if(options && options.debug) {
          /* Don't validate in the debug case so that we don't get errors thrown */
          /* in the debug case, we want all microformats, even if they are invalid */
          targetArray.push(new Microformats[name].mfObject(microformatNodes[i], false));
        } else {
          targetArray.push(new Microformats[name].mfObject(microformatNodes[i], true));
        }
      } catch (ex) {
        /* Creation of individual object probably failed because it is invalid. */
        /* This isn't a problem, because the page might have invalid microformats */
      }
    }
    return targetArray;
  },
  /**
   * Counts microformats objects of the given type from a document
   *
   * @param  name          The name of the microformat (required)
   * @param  rootElement   The DOM element at which to start searching (required)
   * @param  options       Literal object with the following options:
   *                       recurseExternalFrames - Whether or not to search child frames
   *                       that reference external pages (with a src attribute)
   *                       for microformats (optional - defaults to true)
   *                       showHidden -  Whether or not to add hidden microformat
   *                       (optional - defaults to false)
   *                       debug - Whether or not we are in debug mode (optional
   *                       - defaults to false)
   * @return The new count
   */
  count: function(name, rootElement, options) {
    var mfArray = Microformats.get(name, rootElement, options);
    if(mfArray) {
      return mfArray.length;
    }
    return 0;
  },
  /**
   * Returns true if the passed in node is a microformat. Does NOT return true
   * if the passed in node is a child of a microformat.
   *
   * @param  node          DOM node to check
   * @return true if the node is a microformat, false if it is not
   */
  isMicroformat: function(node) {
    for(var i in Microformats) {
      if(Microformats[i].className) {
        if(Microformats.matchClass(node, Microformats[i].className)) {
          return true;
        }
      } else {
        var attribute = node.getAttribute(Microformats[i].attributeName);
        if(attribute) {
          var attributeList = Microformats[i].attributeValues.split(' ');
          for(var j=0; j < attributeList.length; j++) {
            if(attribute.match('(^|\\s)' + attributeList[j] + '(\\s|$)')) {
              return true;
            }
          }
        }
      }
    }
    return false;
  },
  /**
   * This function searches a given nodes ancestors looking for a microformat
   * and if it finds it, returns it. It does NOT include self, so if the passed
   * in node is a microformat, it will still search ancestors for a microformat.
   *
   * @param  node          DOM node to check
   * @return If the node is contained in a microformat, it returns the parent
   *         DOM node, otherwise returns null
   */
  getParent: function(node) {
    var xpathExpression;
    var xpathResult;
    var mfname;

    xpathExpression = 'ancestor::*[';
    for(var i=0; i < Microformats.list.length; i++) {
      mfname = Microformats.list[i];
      if(i !== 0) {
        xpathExpression += ' or ';
      }
      if(Microformats[mfname].className) {
        xpathExpression += 'contains(concat(\' \', @class, \' \'), \' ' + Microformats[mfname].className + ' \')';
      } else {
        var attributeList = Microformats[mfname].attributeValues.split(' ');
        for(var j=0; j < attributeList.length; j++) {
          if(j !== 0) {
            xpathExpression += ' or ';
          }
          xpathExpression += 'contains(concat(\' \', @' + Microformats[mfname].attributeName + ', \' \'), \' ' + attributeList[j] + ' \')';
        }
      }
    }
    xpathExpression += '][1]';
    xpathResult = (node.ownerDocument || node).evaluate(xpathExpression, node, null, XPathResultTypes.FIRST_ORDERED_NODE_TYPE, null);
    if(xpathResult.singleNodeValue) {
      xpathResult.singleNodeValue.microformat = mfname;
      return xpathResult.singleNodeValue;
    }
    return null;
  },
  /**
   * If the passed in node is a microformat, this function returns a space
   * separated list of the microformat names that correspond to this node
   *
   * @param  node          DOM node to check
   * @return If the node is a microformat, a space separated list of microformat
   *         names, otherwise returns nothing
   */
  getNamesFromNode: function(node) {
    var microformatNames = [];
    for(var i in Microformats) {
      if(Microformats[i]) {
        if(Microformats[i].className) {
          if(Microformats.matchClass(node, Microformats[i].className)) {
            microformatNames.push(i);
            continue;
          }
        } else if(Microformats[i].attributeValues) {
          var attribute = node.getAttribute(Microformats[i].attributeName);
          if(attribute) {
            var attributeList = Microformats[i].attributeValues.split(' ');
            for(var j=0; j < attributeList.length; j++) {
              /* If we match any attribute, we've got a microformat */
              if(attribute.match('(^|\\s)' + attributeList[j] + '(\\s|$)')) {
                microformatNames.push(i);
                break;
              }
            }
          }
        }
      }
    }
    return microformatNames.join(' ');
  },
  /**
   * Outputs the contents of a microformat object for debug purposes.
   *
   * @param  microformatObject JavaScript object that represents a microformat
   * @return string containing a visual representation of the contents of the microformat
   */
  debug: function debug(microformatObject) {
    function dumpObject(item, indent) {
      if(!indent) {
        indent = '';
      }
      var toreturn = '';
      var testArray = [];

      for(var i in item) {
        if(testArray[i]) {
          continue;
        }
        if(typeof item[i] == 'object') {
          if((i != 'node') && (i != 'resolvedNode')) {
            if(item[i] && item[i].semanticType) {
              toreturn += indent + item[i].semanticType + ' [' + i + '] { \n';
            } else {
              toreturn += indent + 'object ' + i + ' { \n';
            }
            toreturn += dumpObject(item[i], indent + '\t');
            toreturn += indent + '}\n';
          }
        } else if((typeof item[i] != 'function') && (i != 'semanticType')) {
          if(item[i] !== undefined) {
            toreturn += indent + i + '=' + item[i] + '\n';
          }
        }
      }
      if(!toreturn && item) {
        toreturn = item.toString();
      }
      return toreturn;
    }
    return dumpObject(microformatObject);
  },
  add: function add(microformat, microformatDefinition) {
    /* We always replace an existing definition with the new one */
    if(!Microformats[microformat]) {
      Microformats.list.push(microformat);
    }
    Microformats[microformat] = microformatDefinition;
    microformatDefinition.mfObject.prototype.debug =
      function(microformatObject) {
        return Microformats.debug(microformatObject);
      };
  },
  /* All parser specific functions are contained in this object */
  parser: {
    /**
     * Uses the microformat patterns to decide what the correct text for a
     * given microformat property is. This includes looking at things like
     * abbr, img/alt, area/alt and value excerpting.
     *
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     & @param  datatype   HTML/text - whether to use innerHTML or innerText - defaults to text
     * @return A string with the value of the property
     */
    defaultGetter: function(propnode, parentnode, datatype) {
      var i, j;
      function collapseWhitespace(instring) {
        instring = instring.replace(/[\t\n\r ]+/g, ' ');
        if(instring.charAt(0) == ' ') {
          instring = instring.substring(1, instring.length);
        }
        if(instring.charAt(instring.length - 1) == ' ') {
          instring = instring.substring(0, instring.length - 1);
        }
        return instring;
      }

      if(((((propnode.localName.toLowerCase() == 'abbr') ||
            (propnode.localName.toLowerCase() == 'html:abbr')) &&
           !propnode.namespaceURI) ||
         ((propnode.localName.toLowerCase() == 'abbr') &&
          (propnode.namespaceURI == 'http://www.w3.org/1999/xhtml'))) &&
         (propnode.getAttribute('title'))) {
        return propnode.getAttribute('title');
      } else if((propnode.nodeName.toLowerCase() == 'img') && (propnode.getAttribute('alt'))) {
        return propnode.getAttribute('alt');
      } else if((propnode.nodeName.toLowerCase() == 'area') && (propnode.getAttribute('alt'))) {
        return propnode.getAttribute('alt');
      } else if((propnode.nodeName.toLowerCase() == 'textarea') ||
                (propnode.nodeName.toLowerCase() == 'select') ||
                (propnode.nodeName.toLowerCase() == 'input')) {
        return propnode.value;
      } else {
        var valueTitles = Microformats.getElementsByClassName(propnode, 'value-title');
        for(i = valueTitles.length-1; i >= 0; i--) {
          if(valueTitles[i].parentNode != propnode) {
            valueTitles.splice(i,1);
          }
        }
        if(valueTitles.length > 0) {
          var valueTitle = '';
          for(j=0; j<valueTitles.length; j++) {
            valueTitle += valueTitles[j].getAttribute('title');
          }
          return collapseWhitespace(valueTitle);
        }
        var values = Microformats.getElementsByClassName(propnode, 'value');
        /* Verify that values are children of the propnode */
        for(i = values.length-1; i >= 0; i--) {
          if(values[i].parentNode != propnode) {
            values.splice(i,1);
          }
        }
        if(values.length > 0) {
          var value = '';
          for(j=0; j<values.length; j++) {
            value += Microformats.parser.defaultGetter(values[j], propnode, datatype);
          }
          return collapseWhitespace(value);
        }
        var s;
        if(datatype == 'HTML') {
          s = propnode.innerHTML;
        } else {
          if(propnode.innerText) {
            s = propnode.innerText;
          } else {
            s = propnode.textContent;
          }
        }
        /* If we are processing a value node, don't remove whitespace now */
        /* (we'll do it later) */
        if(!Microformats.matchClass(propnode, 'value')) {
          s = collapseWhitespace(s);
        }
        if(s.length > 0) {
          return s;
        }
      }
      return undefined;
    },
    /**
     * Used to specifically retrieve a date in a microformat node.
     * After getting the default text, it normalizes it to an ISO8601 date.
     *
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     * @param  raw        If set, don't call normalizeISO8601, just return text
     * @return A string with the normalized date.
     */
    dateTimeGetter: function(propnode, parentnode, raw) {
      function parseTime(time) {
        var times;
        if(time.match('am') || time.match('a.m.')) {
          time = time.replace('am', '');
          time = time.replace('a.m.', '');
          times = time.split(':');
          if(times[0] == '12') {
            times[0] = '00';
          }
          if(times[0].length == 1) {
            times[0] = '0' + times[0];
          }
          if(times.length > 1) {
            time = times.join(':');
          } else {
            time = times[0] + ':00:00';
          }
          if(times.length == 2) {
            time += ':00';
          }
        }
        if(time.match('pm') || time.match('p.m.')) {
          time = time.replace('pm', '');
          time = time.replace('p.m.', '');
          times = time.split(':');
          if(times[0] < 12) {
            times[0] = parseInt(times[0]) + 12;
          }
          if(times[0].length == 1) {
            times[0] = '0' + times[0];
          }
          if(times.length > 1) {
            time = times.join(':');
          } else {
            time = times[0] + ':00:00';
          }
          if(times.length == 2) {
            time += ':00';
          }
        }
        return time;
      }
      var date, time, value, offset, i;
      var valueTitles = Microformats.getElementsByClassName(propnode, 'value-title');
      if(valueTitles.length > 0) {
        time = '';
        date = '';
        value = '';
        offset = '';
        for(i=0; i<valueTitles.length; i++) {
          value = valueTitles[i].getAttribute('title');
          if(value.match('T')) {
            return Microformats.parser.normalizeISO8601(value);
          }
          if(value.charAt(4) == '-') {
            date = value;
          } else if((value.charAt(0) == '-') || (value.charAt(0) == '+') || (value == 'Z')) {
            if(value.length == 2) {
              offset = value[0] + '0' + value[1];
            } else {
              offset = value;
            }
          } else {
            time = value;
          }
        }
        time = parseTime(time);
        if(raw) {
          return date + (time ? 'T' : '') + time + offset;
        } else if(date) {
          return Microformats.parser.normalizeISO8601(date + (time ? 'T' : '') + time + offset);
        } else {
          return undefined;
        }
      }
      var values = Microformats.getElementsByClassName(propnode, 'value');
      /* Verify that values are children of the propnode */
      /* Remove any that aren't */
      for(i = values.length-1; i >= 0; i--) {
        if(values[i].parentNode != propnode) {
          values.splice(i,1);
        }
      }
      if(values.length > 0) {
        time = '';
        date = '';
        value = '';
        offset = '';
        for(i=0; i<values.length; i++) {
          value = Microformats.parser.defaultGetter(values[i], propnode);
          if(value.match('T')) {
            return Microformats.parser.normalizeISO8601(value);
          }
          if(value.charAt(4) == '-') {
            date = value;
          } else if((value.charAt(0) == '-') || (value.charAt(0) == '+') || (value == 'Z')) {
            if(value.length == 2) {
              offset = value[0] + '0' + value[1];
            } else {
              offset = value;
            }
          } else {
            time = value;
          }
        }
        time = parseTime(time);
        if(raw) {
          return date + (time ? 'T' : '') + time + offset;
        } else if(date) {
          return Microformats.parser.normalizeISO8601(date + (time ? 'T' : '') + time + offset);
        } else {
          return undefined;
        }
      } else {
        date = '';
        var testDate;
        if(propnode.hasAttribute('title')) {
          date = propnode.getAttribute('title');
          testDate = Microformats.parser.normalizeISO8601(date);
        }
        if(!testDate) {
          date = Microformats.parser.textGetter(propnode, parentnode);
        }
        if(date) {
          if(raw) {
            /* It's just  a time */
            return parseTime(date);
          } else {
            return Microformats.parser.normalizeISO8601(date);
          }
        }
      }
      return undefined;
    },
    /**
     * Used to specifically retrieve a URI in a microformat node. This includes
     * looking at an href/img/object/area to get the fully qualified URI.
     *
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     * @return A string with the fully qualified URI.
     */
    uriGetter: function(propnode, parentnode) {
      var pairs = {'a':'href', 'img':'src', 'object':'data', 'area':'href'};
      var name = propnode.nodeName.toLowerCase();
      if(pairs.hasOwnProperty(name)) {
        return propnode[pairs[name]];
      }
      return Microformats.parser.textGetter(propnode, parentnode);
    },
    /**
     * Used to specifically retrieve a telephone number in a microformat node.
     * Basically this is to handle the face that telephone numbers use value
     * as the name as one of their subproperties, but value is also used for
     * value excerpting (http://microformats.org/wiki/hcard#Value_excerpting)
     *
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     * @return A string with the telephone number
     */
    telGetter: function(propnode, parentnode) {
      var pairs = {'a':'href', 'object':'data', 'area':'href'};
      var name = propnode.nodeName.toLowerCase();
      if(pairs.hasOwnProperty(name)) {
        var protocol;
        if(propnode[pairs[name]].indexOf('tel:') === 0) {
          protocol = 'tel:';
        }
        if(propnode[pairs[name]].indexOf('fax:') === 0) {
          protocol = 'fax:';
        }
        if(propnode[pairs[name]].indexOf('modem:') === 0) {
          protocol = 'modem:';
        }
        if(protocol) {
          if(propnode[pairs[name]].indexOf('?') > 0) {
            return unescape(propnode[pairs[name]].substring(protocol.length, propnode[pairs[name]].indexOf('?')));
          } else {
            return unescape(propnode[pairs[name]].substring(protocol.length));
          }
        }
      }
      /* Special case - if this node is a value, use the parent node to get all the values */
      if(Microformats.matchClass(propnode, 'value')) {
        return Microformats.parser.textGetter(parentnode, parentnode);
      } else {
        /* Virtual case */
        if(!parentnode && (Microformats.getElementsByClassName(propnode, 'type').length > 0)) {
          var tempNode = propnode.cloneNode(true);
          var typeNodes = Microformats.getElementsByClassName(tempNode, 'type');
          for(var i=0; i < typeNodes.length; i++) {
            typeNodes[i].parentNode.removeChild(typeNodes[i]);
          }
          return Microformats.parser.textGetter(tempNode);
        }
        return Microformats.parser.textGetter(propnode, parentnode);
      }
    },
    /**
     * Used to specifically retrieve an email address in a microformat node.
     * This includes at an href, as well as removing subject if specified and
     * the mailto prefix.
     *
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     * @return A string with the email address.
     */
    emailGetter: function(propnode, parentnode) {
      if((propnode.nodeName.toLowerCase() == 'a') || (propnode.nodeName.toLowerCase() == 'area')) {
        var mailto = propnode.href;
        /* IO Service won't fully parse mailto, so we do it manually */
        if(mailto.indexOf('?') > 0) {
          return unescape(mailto.substring('mailto:'.length, mailto.indexOf('?')));
        } else {
          return unescape(mailto.substring('mailto:'.length));
        }
      } else {
        /* Special case - if this node is a value, use the parent node to get all the values */
        /* If this case gets executed, per the value design pattern, the result */
        /* will be the EXACT email address with no extra parsing required */
        if(Microformats.matchClass(propnode, 'value')) {
          return Microformats.parser.textGetter(parentnode, parentnode);
        } else {
          /* Virtual case */
          if(!parentnode && (Microformats.getElementsByClassName(propnode, 'type').length > 0)) {
            var tempNode = propnode.cloneNode(true);
            var typeNodes = Microformats.getElementsByClassName(tempNode, 'type');
            for(var i=0; i < typeNodes.length; i++) {
              typeNodes[i].parentNode.removeChild(typeNodes[i]);
            }
            return Microformats.parser.textGetter(tempNode);
          }
          return Microformats.parser.textGetter(propnode, parentnode);
        }
      }
    },
    /**
     * Used when a caller needs the text inside a particular DOM node.
     * It calls defaultGetter to handle all the subtleties of getting
     * text from a microformat.
     *
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     * @return A string with just the text including all tags.
     */
    textGetter: function(propnode, parentnode) {
      return Microformats.parser.defaultGetter(propnode, parentnode, 'text');
    },
    /**
     * Used when a caller needs the HTML inside a particular DOM node.
     *
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     * @return An emulated string object that also has a new function called toHTML
     */
    HTMLGetter: function(propnode, parentnode) {
      /* This is so we can have a string that behaves like a string */
      /* but also has a new function that can return the HTML that corresponds */
      /* to the string. */
      function mfHTML(value) {
        this.valueOf = function() {return value ? value.valueOf() : ''; };
        this.toString = function() {return value ? value.toString() : ''; };
      }
      mfHTML.prototype = String();
      mfHTML.prototype.toHTML = function() {
        return Microformats.parser.defaultGetter(propnode, parentnode, 'HTML');
      };
      return new mfHTML(Microformats.parser.defaultGetter(propnode, parentnode, 'text'));
    },
    /**
     * Internal parser API used to determine which getter to call based on the
     * datatype specified in the microformat definition.
     *
     * @param  prop       The microformat property in the definition
     * @param  propnode   The DOMNode to check
     * @param  parentnode The parent node of the property. If it is a subproperty,
     *                    this is the parent property node. If it is not, this is the
     *                    microformat node.
     * @return A string with the property value.
     */
    datatypeHelper: function(prop, node, parentnode) {
      var result;
      var datatype = prop.datatype;
      switch (datatype) {
        case 'dateTime':
          result = Microformats.parser.dateTimeGetter(node, parentnode);
          break;
        case 'anyURI':
          result = Microformats.parser.uriGetter(node, parentnode);
          break;
        case 'email':
          result = Microformats.parser.emailGetter(node, parentnode);
          break;
        case 'tel':
          result = Microformats.parser.telGetter(node, parentnode);
          break;
        case 'HTML':
          result = Microformats.parser.HTMLGetter(node, parentnode);
          break;
        case 'float':
          var asText = Microformats.parser.textGetter(node, parentnode);
          if(!isNaN(asText)) {
            result = parseFloat(asText);
          }
          break;
        case 'custom':
          result = prop.customGetter(node, parentnode);
          break;
        case 'microformat':
          try {
            result = new Microformats[prop.microformat].mfObject(node, true);
          } catch (ex) {
            /* There are two reasons we get here, one because the node is not */
            /* a microformat and two because the node is a microformat and */
            /* creation failed. If the node is not a microformat, we just fall */
            /* through and use the default getter since there are some cases */
            /* (location in hCalendar) where a property can be either a microformat */
            /* or a string. If creation failed, we break and simply don't add the */
            /* microformat property to the parent microformat */
            if(ex != 'Node is not a microformat (' + prop.microformat + ')') {
              break;
            }
          }
          if(result !== undefined) {
            if(prop.microformat_property) {
              result = result[prop.microformat_property];
            }
            break;
          }
          result = Microformats.parser.textGetter(node, parentnode);
          break;
        default:
          result = Microformats.parser.textGetter(node, parentnode);
          break;
      }
      /* This handles the case where one property implies another property */
      /* For instance, org by itself is actually org.organization-name */
      if(prop.values && (result !== undefined)) {
        var validType = false;
        for(var value in prop.values) {
          if(result.toLowerCase() == prop.values[value]) {
            result = result.toLowerCase();
            validType = true;
            break;
          }
        }
        if(!validType) {
          return undefined;
        }
      }
      return result;
    },
    newMicroformat: function(object, inNode, microformat, validate) {
      /* check to see if we are even valid */
      if(!Microformats[microformat]) {
        throw ('Invalid microformat - ' + microformat);
      }
      if(inNode.ownerDocument) {
        if(Microformats[microformat].attributeName) {
          if(!(inNode.getAttribute(Microformats[microformat].attributeName))) {
            throw ('Node is not a microformat (' + microformat + ')');
          }
        } else {
          if(!Microformats.matchClass(inNode, Microformats[microformat].className)) {
            throw ('Node is not a microformat (' + microformat + ')');
          }
        }
      }
      var node = inNode;
      if((Microformats[microformat].className) && inNode.ownerDocument) {
        node = Microformats.parser.preProcessMicroformat(inNode);
      }

      for(var i in Microformats[microformat].properties) {
        object.__defineGetter__(i, Microformats.parser.getMicroformatPropertyGenerator(node, microformat, i, object));
      }

      /* The node in the object should be the original node */
      object.node = inNode;
      /* we also store the node that has been "resolved" */
      object.resolvedNode = node;
      object.semanticType = microformat;
      if(validate) {
        Microformats.parser.validate(node, microformat);
      }
    },
    getMicroformatPropertyGenerator: function getMicroformatPropertyGenerator(node, name, property/*, microformat*/) {
      return function() {
        var result = Microformats.parser.getMicroformatProperty(node, name, property);
        //delete microformat[property];
        //microformat[property] = result;
        return result;
      };
    },
    getPropertyInternal: function getPropertyInternal(propnode, parentnode, propobj, propname, mfnode) {
      var result;
      if(propobj.subproperties) {
        for(var subpropname in propobj.subproperties) {
          var subpropnodes;
          var subpropobj = propobj.subproperties[subpropname];
          if(subpropobj.rel === true) {
            subpropnodes = Microformats.getElementsByAttribute(propnode, 'rel', subpropname);
          } else {
            subpropnodes = Microformats.getElementsByClassName(propnode, subpropname);
          }
          var resultArray = [];
          var subresult;
          for(var i = 0; i < subpropnodes.length; i++) {
            subresult = Microformats.parser.getPropertyInternal(subpropnodes[i], propnode,
                                                                subpropobj,
                                                                subpropname, mfnode);
            if(subresult !== undefined) {
              resultArray.push(subresult);
              /* If we're not a plural property, don't bother getting more */
              if(!subpropobj.plural) {
                break;
              }
            }
          }
          if(resultArray.length === 0) {
            subresult = Microformats.parser.getPropertyInternal(propnode, null,
                                                                subpropobj,
                                                                subpropname, mfnode);
            if(subresult !== undefined) {
              resultArray.push(subresult);
            }
          }
          if(resultArray.length > 0) {
            result = result || {};
            if(subpropobj.plural) {
              result[subpropname] = resultArray;
            } else {
              result[subpropname] = resultArray[0];
            }
          }
        }
      }
      if(!parentnode || ((result === undefined) && propobj.subproperties)) {
        if(propobj.virtual) {
          if(propobj.virtualGetter) {
            result = propobj.virtualGetter(mfnode || propnode);
          } else {
            result = Microformats.parser.datatypeHelper(propobj, propnode);
          }
        }
      } else if(result === undefined) {
        result = Microformats.parser.datatypeHelper(propobj, propnode, parentnode);
        if((result === undefined) && !propobj.subproperties) {
          if(propobj.virtual && propobj.virtualGetter) {
            result = propobj.virtualGetter(parentnode);
          }
        }
      }
      return result;
    },
    getMicroformatProperty: function getMicroformatProperty(inMfNode, mfname, propname) {
      var mfnode = inMfNode;
      var i, j;
      /* If the node has not been preprocessed, the requested microformat */
      /* is a class based microformat and the passed in node is not the */
      /* entire document, preprocess it. Preprocessing the node involves */
      /* creating a duplicate of the node and taking care of things like */
      /* the include and header design patterns */
      if(!inMfNode.origNode && Microformats[mfname].className && inMfNode.ownerDocument) {
        mfnode = Microformats.parser.preProcessMicroformat(inMfNode);
      }
      /* propobj is the corresponding property object in the microformat */
      var propobj;
      /* If there is a corresponding property in the microformat, use it */
      if(Microformats[mfname].properties[propname]) {
        propobj = Microformats[mfname].properties[propname];
      } else {
        /* If we didn't get a property, bail */
        return undefined;
      }
      /* Query the correct set of nodes (rel or class) based on the setting */
      /* in the property */
      var propnodes;
      if(propobj.rel === true) {
        propnodes = Microformats.getElementsByAttribute(mfnode, 'rel', propname);
      } else {
        propnodes = Microformats.getElementsByClassName(mfnode, propname);
      }
      for(i=propnodes.length-1; i >= 0; i--) {
        /* The reason getParent is not used here is because this code does */
        /* not apply to attribute based microformats, plus adr and geo */
        /* when contained in hCard are a special case */
        var parentnode;
        var node = propnodes[i];
        var xpathExpression = '';
        for(j=0; j < Microformats.list.length; j++) {
          /* Don't treat adr or geo in an hCard as a microformat in this case */
          if((mfname == 'hCard') && ((Microformats.list[j] == 'adr') || (Microformats.list[j] == 'geo'))) {
            continue;
          }
          if(Microformats[Microformats.list[j]].className) {
            if(xpathExpression.length === 0) {
              xpathExpression = 'ancestor::*[';
            } else {
              xpathExpression += ' or ';
            }
            xpathExpression += 'contains(concat(\' \', @class, \' \'), \' ' + Microformats[Microformats.list[j]].className + ' \')';
          }
        }
        xpathExpression += '][1]';
        var xpathResult = (node.ownerDocument || node).evaluate(xpathExpression, node, null, XPathResultTypes.FIRST_ORDERED_NODE_TYPE, null);
        if(xpathResult.singleNodeValue) {
          xpathResult.singleNodeValue.microformat = mfname;
          parentnode = xpathResult.singleNodeValue;
        }
        /* If the propnode is not a child of the microformat, and */
        /* the property belongs to the parent microformat as well, */
        /* remove it. */
        if(parentnode != mfnode) {
          var mfNameString = Microformats.getNamesFromNode(parentnode);
          var mfNames = mfNameString.split(' ');
          for(j=0; j < mfNames.length; j++) {
            /* If this property is in the parent microformat, remove the node  */
            if(Microformats[mfNames[j]].properties[propname]) {
              propnodes.splice(i,1);
              break;
            }
          }
        }
      }
      if(propnodes.length > 0) {
        var resultArray = [];
        for(i = 0; i < propnodes.length; i++) {
          var subresult = Microformats.parser.getPropertyInternal(propnodes[i],
                                                                  mfnode,
                                                                  propobj,
                                                                  propname,
                                                                  mfnode);
          if(subresult !== undefined) {
            resultArray.push(subresult);
            /* If we're not a plural property, don't bother getting more */
            if(!propobj.plural) {
              return resultArray[0];
            }
          }
        }
        if(resultArray.length > 0) {
          return resultArray;
        }
      } else {
        /* If we didn't find any class nodes, check to see if this property */
        /* is virtual and if so, call getPropertyInternal again */
        if(propobj.virtual) {
          return Microformats.parser.getPropertyInternal(mfnode, null,
                                                         propobj, propname, mfnode);
        }
      }
      return undefined;
    },
    /**
     * Internal parser API used to resolve includes and headers. Includes are
     * resolved by simply cloning the node and replacing it in a clone of the
     * original DOM node. Headers are resolved by creating a span and then copying
     * the innerHTML and the class name.
     *
     * @param  inMfNode The node to preProcess.
     * @return If the node had includes or headers, a cloned node otherwise
     *         the original node. You can check to see if the node was cloned
     *         by looking for .origNode in the new node.
     */
    preProcessMicroformat: function preProcessMicroformat(inMfNode) {
      var mfnode, i;
      if((inMfNode.nodeName.toLowerCase() == 'td') && (inMfNode.getAttribute('headers'))) {
        mfnode = inMfNode.cloneNode(true);
        mfnode.origNode = inMfNode;
        var headers = inMfNode.getAttribute('headers').split(' ');
        for(i = 0; i < headers.length; i++) {
          var tempNode = inMfNode.ownerDocument.createElement('span');
          var headerNode = inMfNode.ownerDocument.getElementById(headers[i]);
          if(headerNode) {
            tempNode.innerHTML = headerNode.innerHTML;
            tempNode.className = headerNode.className;
            mfnode.appendChild(tempNode);
          }
        }
      } else {
        mfnode = inMfNode;
      }
      var includes = Microformats.getElementsByClassName(mfnode, 'include');
      if(includes.length > 0) {
        /* If we didn't clone, clone now */
        if(!mfnode.origNode) {
          mfnode = inMfNode.cloneNode(true);
          mfnode.origNode = inMfNode;
        }
        includes = Microformats.getElementsByClassName(mfnode, 'include');
        var includeId;
        var includeLength = includes.length;
        for(i = includeLength -1; i >= 0; i--) {
          if(includes[i].nodeName.toLowerCase() == 'a') {
            includeId = includes[i].getAttribute('href').substr(1);
          }
          if(includes[i].nodeName.toLowerCase() == 'object') {
            includeId = includes[i].getAttribute('data').substr(1);
          }
          if(inMfNode.ownerDocument.getElementById(includeId)) {
            includes[i].parentNode.replaceChild(inMfNode.ownerDocument.getElementById(includeId).cloneNode(true), includes[i]);
          }
        }
      }
      return mfnode;
    },
    validate: function validate(mfnode, mfname) {
      var error = '';
      if(Microformats[mfname].validate) {
        return Microformats[mfname].validate(mfnode);
      } else if(Microformats[mfname].required) {
        for(var i=0; i<Microformats[mfname].required.length; i++) {
          if(!Microformats.parser.getMicroformatProperty(mfnode, mfname, Microformats[mfname].required[i])) {
            error += 'Required property ' + Microformats[mfname].required[i] + ' not specified\n';
          }
        }
        if(error.length > 0) {
          throw (error);
        }
        return true;
      }
      return false;
    },
    reDate: /(\d\d\d\d)(?:-?(\d\d[\d]*)(?:-?([\d]*)(?:[T ](\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(?:Z|(?:([-+])(\d\d)(?::?(\d\d))?)?)?)?)?)?/,
    /* This function normalizes an ISO8601 date by adding punctuation and */
    /* ensuring that hours and seconds have values */
    normalizeISO8601: function normalizeISO8601(string) {
      var dateArray = string.match(this.reDate);

      var dateString;
      //var tzOffset = 0;
      if(!dateArray) {
        return undefined;
      }
      /* Year */
      if(dateArray[1]) {
        dateString = dateArray[1];
        /* Month */
        if(dateArray[2]) {
          dateString += '-' + dateArray[2];
          /* Day */
          if(dateArray[3] || dateArray[4]) {
            if(dateArray[3]) {
              dateString += '-' + dateArray[3];
            }
            /* Hours */
            if(dateArray[4]) {
              dateString += 'T' + dateArray[4];
              /* Minutes */
              if(dateArray[5]) {
                dateString += ':' + dateArray[5];
              } else {
                dateString += ':' + '00';
              }
              /* Seconds */
              if(dateArray[6]) {
                dateString += ':' + dateArray[6];
              } else {
                dateString += ':' + '00';
              }
              if(dateArray[7]) {
                dateString += '.' + dateArray[7];
              }
              if(dateArray[8]) {
                dateString += dateArray[8];
                if((dateArray[8] == '+') || (dateArray[8] == '-')) {
                  if(dateArray[9]) {
                    if(dateArray[9].length == 1) {
                      dateString += '0';
                    }
                    dateString += dateArray[9];
                    if(dateArray[10]) {
                      dateString += dateArray[10];
                    } else {
                      dateString += '00';
                    }
                  }
                }
              }
            }
          }
        }
      }
      if(string.indexOf('Z') > -1) {
        dateString += 'Z';
      }
      return dateString;
    }
  },
  /**
   * Converts an ISO8601 date into a JavaScript date object, honoring the TZ
   * offset and Z if present to convert the date to local time
   * NOTE: I'm using an extra parameter on the date object for this function.
   * I set date.time to true if there is a date, otherwise date.time is false.
   *
   * @param  string ISO8601 formatted date
   * @return JavaScript date object that represents the ISO date.
   */
  dateFromISO8601: function dateFromISO8601(string) {
    var dateArray = string.match(this.reDate);

    if(dateArray[2] && !dateArray[3]) {
      /* This indicates we have a month only */
      var d = new Date('01/01/' + dateArray[1]);
      d.setDate(dateArray[2]);
      dateArray[2] = d.getMonth() + 1;
      dateArray[3] = d.getDate();
    }

    var date = new Date(dateArray[1], 0, 1);
    date.time = false;

    if(dateArray[2]) {
      date.setMonth(dateArray[2] - 1);
    }
    if(dateArray[3]) {
      date.setDate(dateArray[3]);
    }
    if(dateArray[4]) {
      date.setHours(dateArray[4]);
      date.time = true;
      if(dateArray[5]) {
        date.setMinutes(dateArray[5]);
        if(dateArray[6]) {
          date.setSeconds(dateArray[6]);
          if(dateArray[7]) {
            date.setMilliseconds(Number('0.' + dateArray[7]) * 1000);
          }
        }
      }
    }
    if(dateArray[8]) {
      if(dateArray[8] == '-') {
        if(dateArray[9] && dateArray[10]) {
          date.setHours(date.getHours() + parseInt(dateArray[9], 10));
          date.setMinutes(date.getMinutes() + parseInt(dateArray[10], 10));
        }
      } else if(dateArray[8] == '+') {
        if(dateArray[9] && dateArray[10]) {
          date.setHours(date.getHours() - parseInt(dateArray[9], 10));
          date.setMinutes(date.getMinutes() - parseInt(dateArray[10], 10));
        }
      }
      /* at this point we have the time in gmt */
      /* convert to local if we had a Z - or + */
      if(dateArray[8]) {
        var tzOffset = date.getTimezoneOffset();
        if(tzOffset < 0) {
          date.setMinutes(date.getMinutes() + tzOffset);
        } else if(tzOffset > 0) {
          date.setMinutes(date.getMinutes() - tzOffset);
        }
      }
    }
    return date;
  },
  /**
   * Converts a Javascript date object into an ISO 8601 formatted date
   * NOTE: I'm using an extra parameter on the date object for this function.
   * If date.time is NOT true, this function only outputs the date.
   *
   * @param  date        Javascript Date object
   * @param  punctuation true if the date should have -/:
   * @return string with the ISO date.
   */
  iso8601FromDate: function iso8601FromDate(date, punctuation) {
    var string = date.getFullYear().toString();
    if(punctuation) {
      string += '-';
    }
    string += (date.getMonth() + 1).toString().replace(/\b(\d)\b/g, '0$1');
    if(punctuation) {
      string += '-';
    }
    string += date.getDate().toString().replace(/\b(\d)\b/g, '0$1');
    if(date.time) {
      string += 'T';
      string += date.getHours().toString().replace(/\b(\d)\b/g, '0$1');
      if(punctuation) {
        string += ':';
      }
      string += date.getMinutes().toString().replace(/\b(\d)\b/g, '0$1');
      if(punctuation) {
        string += ':';
      }
      string += date.getSeconds().toString().replace(/\b(\d)\b/g, '0$1');
      if(date.getMilliseconds() > 0) {
        if(punctuation) {
          string += '.';
        }
        string += date.getMilliseconds().toString();
      }
    }
    return string;
  },
  simpleEscape: function simpleEscape(s) {
    s = s.replace(/\&/g, '%26');
    s = s.replace(/\#/g, '%23');
    s = s.replace(/\+/g, '%2B');
    s = s.replace(/\-/g, '%2D');
    s = s.replace(/\=/g, '%3D');
    s = s.replace(/\'/g, '%27');
    s = s.replace(/\,/g, '%2C');
    //s = s.replace(/\r/g, '%0D');
    //s = s.replace(/\n/g, '%0A');
    s = s.replace(/ /g, '+');
    return s;
  },
  /**
   * Not intended for external consumption. Microformat implementations might use it.
   *
   * Retrieve elements matching all classes listed in a space-separated string.
   * I had to implement my own because I need an Array, not an nsIDomNodeList
   *
   * @param  rootElement      The DOM element at which to start searching (optional)
   * @param  className        A space separated list of classenames
   * @return microformatNodes An array of DOM Nodes, each representing a
                              microformat in the document.
   */
  getElementsByClassName: function getElementsByClassName(rootNode, className) {
    var returnElements = [];
    var i;

    if((rootNode.ownerDocument || rootNode).getElementsByClassName) {
      /* Firefox 3 - native getElementsByClassName */
      var col = rootNode.getElementsByClassName(className);
      for(i = 0; i < col.length; i++) {
        returnElements[i] = col[i];
      }
    } else if((rootNode.ownerDocument || rootNode).evaluate) {
      /* Firefox 2 and below - XPath */
      var xpathExpression;
      xpathExpression = './/*[contains(concat(\' \', @class, \' \'), \' ' + className + ' \')]';
      var xpathResult = (rootNode.ownerDocument || rootNode).evaluate(xpathExpression, rootNode, null, XPathResultTypes.ANY_TYPE, null);

      var node;
      while((node = xpathResult.iterateNext())) {
        returnElements.push(node);
      }
    } else {
      /* Slow fallback for testing */
      className = className.replace(/\-/g, '\\-');
      var elements = rootNode.getElementsByTagName('*');
      for(i=0; i<elements.length; i++) {
        if(elements[i].className.match('(^|\\s)' + className + '(\\s|$)')) {
          returnElements.push(elements[i]);
        }
      }
    }
    return returnElements;
  },
  /**
   * Not intended for external consumption. Microformat implementations might use it.
   *
   * Retrieve elements matching an attribute and an attribute list in a space-separated string.
   *
   * @param  rootElement      The DOM element at which to start searching (optional)
   * @param  atributeName     The attribute name to match against
   * @param  attributeValues  A space separated list of attribute values
   * @return microformatNodes An array of DOM Nodes, each representing a
                              microformat in the document.
   */
  getElementsByAttribute: function getElementsByAttribute(rootNode, attributeName, attributeValues) {
    var attributeList = attributeValues.split(' ');

    var returnElements = [];

    if((rootNode.ownerDocument || rootNode).evaluate) {
      /* Firefox 3 and below - XPath */
      /* Create an XPath expression based on the attribute list */
      var xpathExpression = './/*[';
      for(var i = 0; i < attributeList.length; i++) {
        if(i !== 0) {
          xpathExpression += ' or ';
        }
        xpathExpression += 'contains(concat(\' \', @' + attributeName + ', \' \'), \' ' + attributeList[i] + ' \')';
      }
      xpathExpression += ']';

      var xpathResult = (rootNode.ownerDocument || rootNode).evaluate(xpathExpression, rootNode, null, XPathResultTypes.ANY_TYPE, null);

      var node;
      while((node = xpathResult.iterateNext())) {
        returnElements.push(node);
      }
    } else {
      /* Need Slow fallback for testing */
    }
    return returnElements;
  },
  matchClass: function matchClass(node, className) {
    var classValue = node.getAttribute('class');
    return (classValue && classValue.match('(^|\\s)' + className + '(\\s|$)'));
  }
};

/* MICROFORMAT DEFINITIONS BEGIN HERE */

function adr(node, validate) {
  if(node) {
    Microformats.parser.newMicroformat(this, node, 'adr', validate);
  }
}

adr.prototype.toString = function() {
  var addressText = '';
  var startParens = false;
  if(this['street-address']) {
    addressText += this['street-address'][0];
  } else if(this['extended-address']) {
    addressText += this['extended-address'];
  }
  if(this.locality) {
    if(this['street-address'] || this['extended-address']) {
      addressText += ' (';
      startParens = true;
    }
    addressText += this.locality;
  }
  if(this.region) {
    if((this['street-address'] || this['extended-address']) && (!startParens)) {
      addressText += ' (';
      startParens = true;
    } else if(this.locality) {
      addressText += ', ';
    }
    addressText += this.region;
  }
  if(this['country-name']) {
    if((this['street-address'] || this['extended-address']) && (!startParens)) {
      addressText += ' (';
      startParens = true;
      addressText += this['country-name'];
    } else if((!this.locality) && (!this.region)) {
      addressText += this['country-name'];
    } else if(((!this.locality) && (this.region)) || ((this.locality) && (!this.region))) {
      addressText += ', ';
      addressText += this['country-name'];
    }
  }
  if(startParens) {
    addressText += ')';
  }
  return addressText;
};

var adrDefinition = {
  mfObject: adr,
  className: 'adr',
  properties: {
    'type' : {
      plural: true,
      values: ['work', 'home', 'pref', 'postal', 'dom', 'intl', 'parcel']
    },
    'post-office-box' : {
    },
    'street-address' : {
      plural: true
    },
    'extended-address' : {
    },
    'locality' : {
    },
    'region' : {
    },
    'postal-code' : {
    },
    'country-name' : {
    }
  },
  validate: function(node) {
    var xpathExpression = 'count(descendant::*[' +
                                              'contains(concat(\' \', @class, \' \'), \' post-office-box \')' +
                                              ' or contains(concat(\' \', @class, \' \'), \' street-address \')' +
                                              ' or contains(concat(\' \', @class, \' \'), \' extended-address \')' +
                                              ' or contains(concat(\' \', @class, \' \'), \' locality \')' +
                                              ' or contains(concat(\' \', @class, \' \'), \' region \')' +
                                              ' or contains(concat(\' \', @class, \' \'), \' postal-code \')' +
                                              ' or contains(concat(\' \', @class, \' \'), \' country-name\')' +
                                              '])';
    var xpathResult = (node.ownerDocument || node).evaluate(xpathExpression, node, null, XPathResultTypes.ANY_TYPE, null).numberValue;
    if(xpathResult === 0) {
      throw ('Unable to create microformat');
    }
    return true;
  }
};

Microformats.add('adr', adrDefinition);

function hCard(node, validate) {
  if(node) {
    Microformats.parser.newMicroformat(this, node, 'hCard', validate);
  }
}
hCard.prototype.toString = function() {
  if(this.resolvedNode) {
    /* If this microformat has an include pattern, put the */
    /* organization-name in parenthesis after the fn to differentiate */
    /* them. */
    var fns = Microformats.getElementsByClassName(this.node, 'fn');
    if(fns.length === 0) {
      if(this.fn) {
        if(this.org && this.org[0]['organization-name'] && (this.fn != this.org[0]['organization-name'])) {
          return this.fn + ' (' + this.org[0]['organization-name'] + ')';
        }
      }
    }
  }
  return this.fn;
};

var hCardDefinition = {
  mfObject: hCard,
  className: 'vcard',
  required: ['fn'],
  properties: {
    'adr' : {
      plural: true,
      datatype: 'microformat',
      microformat: 'adr'
    },
    'agent' : {
      plural: true,
      datatype: 'microformat',
      microformat: 'hCard'
    },
    'bday' : {
      datatype: 'dateTime'
    },
    'class' : {
    },
    'category' : {
      plural: true,
      datatype: 'microformat',
      microformat: 'tag',
      microformat_property: 'tag'
    },
    'email' : {
      subproperties: {
        'type' : {
          plural: true,
          values: ['internet', 'x400', 'pref']
        },
        'value' : {
          datatype: 'email',
          virtual: true
        }
      },
      plural: true
    },
    'fn' : {
      required: true,
      virtual: true,
      virtualGetter: function(mfnode) {
        /* Infer fn from n sub properties */
        var fn = '';
        var xpathExpression;
        xpathExpression = './/*[contains(concat(\' \', @class, \' \'), \' ' + 'given-name' + ' \') or ' +
                               'contains(concat(\' \', @class, \' \'), \' ' + 'family-name' + ' \') or ' +
                               'contains(concat(\' \', @class, \' \'), \' ' + 'additional-name' + ' \')' +
                               ']';
        var xpathResult = mfnode.ownerDocument.evaluate(xpathExpression, mfnode, null, XPathResultTypes.ANY_TYPE, null);
        var node;
        while((node = xpathResult.iterateNext())) {
          if(fn.length === 0) {
            fn += node.textContent;
          } else {
            fn += ' ' + node.textContent;
          }
        }
        if(fn.length > 0) {
          return fn;
        }
        return undefined;
      }
    },
    'geo' : {
      datatype: 'microformat',
      microformat: 'geo'
    },
    'key' : {
      plural: true
    },
    'label' : {
      plural: true
    },
    'logo' : {
      plural: true,
      datatype: 'anyURI'
    },
    'mailer' : {
      plural: true
    },
    'n' : {
      subproperties: {
        'honorific-prefix' : {
          plural: true
        },
        'given-name' : {
          plural: true
        },
        'additional-name' : {
          plural: true
        },
        'family-name' : {
          plural: true
        },
        'honorific-suffix' : {
          plural: true
        }
      },
      virtual: true,
      /*  Implied "n" Optimization */
      /* http://microformats.org/wiki/hcard#Implied_.22n.22_Optimization */
      virtualGetter: function(mfnode) {
        var fn = Microformats.parser.getMicroformatProperty(mfnode, 'hCard', 'fn');
        var orgs = Microformats.parser.getMicroformatProperty(mfnode, 'hCard', 'org');
        var givenname = [];
        var familyname = [];
        if(fn && (!orgs || (orgs.length > 1) || (fn != orgs[0]['organization-name']))) {
          var fns = fn.split(' ');
          if(fns.length === 2) {
            if(fns[0].charAt(fns[0].length-1) == ',') {
              givenname[0] = fns[1];
              familyname[0] = fns[0].substr(0, fns[0].length-1);
            } else if(fns[1].length == 1) {
              givenname[0] = fns[1];
              familyname[0] = fns[0];
            } else if((fns[1].length == 2) && (fns[1].charAt(fns[1].length-1) == '.')) {
              givenname[0] = fns[1];
              familyname[0] = fns[0];
            } else {
              givenname[0] = fns[0];
              familyname[0] = fns[1];
            }
            return {'given-name' : givenname, 'family-name' : familyname};
          }
        }
        return undefined;
      }
    },
    'nickname' : {
      plural: true,
      virtual: true,
      /* Implied "nickname" Optimization */
      /* http://microformats.org/wiki/hcard#Implied_.22nickname.22_Optimization */
      virtualGetter: function(mfnode) {
        var fn = Microformats.parser.getMicroformatProperty(mfnode, 'hCard', 'fn');
        var orgs = Microformats.parser.getMicroformatProperty(mfnode, 'hCard', 'org');
        //var givenname;
        //var familyname;
        if(fn && (!orgs || (orgs.length) > 1 || (fn != orgs[0]['organization-name']))) {
          var fns = fn.split(' ');
          if(fns.length === 1) {
            return [fns[0]];
          }
        }
        return undefined;
      }
    },
    'note' : {
      plural: true,
      datatype: 'HTML'
    },
    'org' : {
      subproperties: {
        'organization-name' : {
          virtual: true
        },
        'organization-unit' : {
          plural: true
        }
      },
      plural: true
    },
    'photo' : {
      plural: true,
      datatype: 'anyURI'
    },
    'rev' : {
      datatype: 'dateTime'
    },
    'role' : {
      plural: true
    },
    'sequence' : {
    },
    'sort-string' : {
    },
    'sound' : {
      plural: true
    },
    'title' : {
      plural: true
    },
    'tel' : {
      subproperties: {
        'type' : {
          plural: true,
          values: ['msg', 'home', 'work', 'pref', 'voice', 'fax', 'cell', 'video', 'pager', 'bbs', 'car', 'isdn', 'pcs']
        },
        'value' : {
          datatype: 'tel',
          virtual: true
        }
      },
      plural: true
    },
    'tz' : {
    },
    'uid' : {
      datatype: 'anyURI'
    },
    'url' : {
      plural: true,
      datatype: 'anyURI'
    }
  }
};

Microformats.add('hCard', hCardDefinition);

function hCalendar(node, validate) {
  if(node) {
    Microformats.parser.newMicroformat(this, node, 'hCalendar', validate);
  }
}
hCalendar.prototype.toString = function() {
  if(this.resolvedNode) {
    /* If this microformat has an include pattern, put the */
    /* dtstart in parenthesis after the summary to differentiate */
    /* them. */
    var summaries = Microformats.getElementsByClassName(this.node, 'summary');
    if(summaries.length === 0) {
      if(this.summary) {
        if(this.dtstart) {
          return this.summary + ' (' + Microformats.dateFromISO8601(this.dtstart).toLocaleString() + ')';
        }
      }
    }
  }
  if(this.dtstart) {
    return this.summary;
  }
  return undefined;
};

var hCalendarDefinition = {
  mfObject: hCalendar,
  className: 'vevent',
  required: ['summary', 'dtstart'],
  properties: {
    'category' : {
      plural: true,
      datatype: 'microformat',
      microformat: 'tag',
      microformat_property: 'tag'
    },
    'class' : {
      values: ['public', 'private', 'confidential']
    },
    'description' : {
      datatype: 'HTML'
    },
    'dtstart' : {
      datatype: 'dateTime'
    },
    'dtend' : {
      datatype: 'dateTime',
      virtual: true,
      /* This will only be called in the virtual case */
      /* If we got here, we have a dtend time without date */
      virtualGetter: function(mfnode) {
        var dtends = Microformats.getElementsByClassName(mfnode, 'dtend');
        if(dtends.length === 0) {
          return undefined;
        }
        var dtend = Microformats.parser.dateTimeGetter(dtends[0], mfnode, true);
        var dtstarts = Microformats.getElementsByClassName(mfnode, 'dtstart');
        if(dtstarts.length > 0) {
          var dtstart = Microformats.parser.dateTimeGetter(dtstarts[0], mfnode);
          if(dtstart.match('T')) {
            return Microformats.parser.normalizeISO8601(dtstart.split('T')[0] + 'T' + dtend);
          }
        }
        return undefined;
      }
    },
    'dtstamp' : {
      datatype: 'dateTime'
    },
    'duration' : {
    },
    'geo' : {
      datatype: 'microformat',
      microformat: 'geo'
    },
    'location' : {
      datatype: 'microformat',
      microformat: 'hCard'
    },
    'status' : {
      values: ['tentative', 'confirmed', 'cancelled']
    },
    'summary' : {},
    'transp' : {
      values: ['opaque', 'transparent']
    },
    'uid' : {
      datatype: 'anyURI'
    },
    'url' : {
      datatype: 'anyURI'
    },
    'last-modified' : {
      datatype: 'dateTime'
    },
    'rrule' : {
      subproperties: {
        'interval' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'interval');
          }
        },
        'freq' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'freq');
          }
        },
        'bysecond' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'bysecond');
          }
        },
        'byminute' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'byminute');
          }
        },
        'byhour' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'byhour');
          }
        },
        'bymonthday' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'bymonthday');
          }
        },
        'byyearday' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'byyearday');
          }
        },
        'byweekno' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'byweekno');
          }
        },
        'bymonth' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'bymonth');
          }
        },
        'byday' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'byday');
          }
        },
        'until' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'until');
          }
        },
        'count' : {
          virtual: true,
          /* This will only be called in the virtual case */
          virtualGetter: function(mfnode) {
            return Microformats.hCalendar.properties.rrule.retrieve(mfnode, 'count');
          }
        }
      },
      retrieve: function(mfnode, property) {
        var value = Microformats.parser.textGetter(mfnode);
        var rrule;
        rrule = value.split(';');
        for(var i=0; i < rrule.length; i++) {
          if(rrule[i].match(property)) {
            return rrule[i].split('=')[1];
          }
        }
        return undefined;
      }
    }
  }
};

Microformats.add('hCalendar', hCalendarDefinition);

function geo(node, validate) {
  if(node) {
    Microformats.parser.newMicroformat(this, node, 'geo', validate);
  }
}
geo.prototype.toString = function() {
  function collapseWhitespace(instring) {
    instring = instring.replace(/[\t\n\r ]+/g, ' ');
    if(instring.charAt(0) == ' ') {
      instring = instring.substring(1, instring.length);
    }
    if(instring.charAt(instring.length - 1) == ' ') {
      instring = instring.substring(0, instring.length - 1);
    }
    return instring;
  }

  if(this.latitude !== undefined) {
    if(!isFinite(this.latitude) || (this.latitude > 360) || (this.latitude < -360)) {
      return undefined;
    }
  }
  if(this.longitude !== undefined) {
    if(!isFinite(this.longitude) || (this.longitude > 360) || (this.longitude < -360)) {
      return undefined;
    }
  }

  if((this.latitude !== undefined) && (this.longitude !== undefined)) {
    var s;
    var valueTitles = Microformats.getElementsByClassName(this.node, 'value-title');
    if((this.node.localName.toLowerCase() == 'abbr') ||
        (this.node.localName.toLowerCase() == 'html:abbr') ||
        (valueTitles.length > 0)) {
      s = collapseWhitespace(this.node.textContent);
    }

    if(s) {
      return s;
    }

    /* check if geo is contained in a vcard */
    var xpathExpression = 'ancestor::*[contains(concat(\' \', @class, \' \'), \' vcard \')][1]';
    var xpathResult = this.node.ownerDocument.evaluate(xpathExpression, this.node, null,  XPathResultTypes.FIRST_ORDERED_NODE_TYPE, null);
    if(xpathResult.singleNodeValue) {
      var hcard = new hCard(xpathResult.singleNodeValue);
      if(hcard.fn) {
        return hcard.fn;
      }
    }
    /* check if geo is contained in a vevent */
    xpathExpression = 'ancestor::*[contains(concat(\' \', @class, \' \'), \' vevent \')][1]';
    xpathResult = this.node.ownerDocument.evaluate(xpathExpression, this.node, null, XPathResultTypes.FIRST_ORDERED_NODE_TYPE, xpathResult);
    if(xpathResult.singleNodeValue) {
      var hcal = new hCalendar(xpathResult.singleNodeValue);
      if(hcal.summary) {
        return hcal.summary;
      }
    }
    return this.latitude + ', ' + this.longitude;
  }
  return undefined;
};

var geoDefinition = {
  mfObject: geo,
  className: 'geo',
  required: ['latitude','longitude'],
  properties: {
    'latitude' : {
      datatype: 'float',
      virtual: true,
      /* This will only be called in the virtual case */
      virtualGetter: function(mfnode) {
        var value = Microformats.parser.textGetter(mfnode);
        var latlong;
        if(value && value.match(';')) {
          latlong = value.split(';');
          if(latlong[0]) {
            if(!isNaN(latlong[0])) {
              return parseFloat(latlong[0]);
            }
          }
        }
        return undefined;
      }
    },
    'longitude' : {
      datatype: 'float',
      virtual: true,
      /* This will only be called in the virtual case */
      virtualGetter: function(mfnode) {
        var value = Microformats.parser.textGetter(mfnode);
        var latlong;
        if(value && value.match(';')) {
          latlong = value.split(';');
          if(latlong[1]) {
            if(!isNaN(latlong[1])) {
              return parseFloat(latlong[1]);
            }
          }
        }
        return undefined;
      }
    }
  },
  validate: function(node) {
    var latitude = Microformats.parser.getMicroformatProperty(node, 'geo', 'latitude');
    var longitude = Microformats.parser.getMicroformatProperty(node, 'geo', 'longitude');
    if(latitude !== undefined) {
      if(!isFinite(latitude) || (latitude > 360) || (latitude < -360)) {
        throw ('Invalid latitude');
      }
    } else {
      throw ('No latitude specified');
    }
    if(longitude !== undefined) {
      if(!isFinite(longitude) || (longitude > 360) || (longitude < -360)) {
        throw ('Invalid longitude');
      }
    } else {
      throw ('No longitude specified');
    }
    return true;
  }
};

Microformats.add('geo', geoDefinition);

function tag(node, validate) {
  if(node) {
    Microformats.parser.newMicroformat(this, node, 'tag', validate);
  }
}
tag.prototype.toString = function() {
  return this.tag;
};

var tagDefinition = {
  mfObject: tag,
  attributeName: 'rel',
  attributeValues: 'tag',
  properties: {
    'tag' : {
      virtual: true,
      virtualGetter: function(mfnode) {
        if(mfnode.href) {
          var href = mfnode.href.split('?')[0].split('#')[0];
          var urlArray = href.split('/');
          for(var i=urlArray.length-1; i > 0; i--) {
            if(urlArray[i] !== '') {
              var tag = Microformats.tag.validTagName(urlArray[i].replace(/\+/g, ' '));
              if(tag) {
                try {
                  return decodeURIComponent(tag);
                } catch (ex) {
                  return unescape(tag);
                }
              }
            }
          }
        }
        return null;
      }
    },
    'link' : {
      virtual: true,
      datatype: 'anyURI'
    },
    'text' : {
      virtual: true
    }
  },
  validTagName: function(tag) {
    var returnTag = tag;
    if(tag.indexOf('?') != -1) {
      if(tag.indexOf('?') === 0) {
        return false;
      } else {
        returnTag = tag.substr(0, tag.indexOf('?'));
      }
    }
    if(tag.indexOf('#') != -1) {
      if(tag.indexOf('#') === 0) {
        return false;
      } else {
        returnTag = tag.substr(0, tag.indexOf('#'));
      }
    }
    if(tag.indexOf('.html') != -1) {
      if(tag.indexOf('.html') == tag.length - 5) {
        return false;
      }
    }
    return returnTag;
  },
  validate: function(node) {
    var tag = Microformats.parser.getMicroformatProperty(node, 'tag', 'tag');
    if(!tag) {
      if(node.href) {
        var urlArray = node.getAttribute('href').split('/');
        for(var i=urlArray.length-1; i > 0; i--) {
          if(urlArray[i] !== '') {
            throw ('Invalid tag name (' + urlArray[i] + ')');
          }
        }
      } else {
        throw ('No href specified on tag');
      }
    }
    return true;
  }
};

Microformats.add('tag', tagDefinition);

/*EXPORTED_SYMBOLS.forEach(function(symbol) {
  exports[symbol] = global[symbol];
});*/
exports.Microformats = Microformats;