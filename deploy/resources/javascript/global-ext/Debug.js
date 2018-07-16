/**
 * Util class for debug trace
 */
gw.Debug = function() {
  var loggingEnum = { OFF: 'off', ON: 'on', VERBOSE: 'verbose'};
  if (Object.freeze) {
    // freeze our enum if the browser supports it
    Object.freeze(loggingEnum);
  }

  function getDbgWin() {
    if (window._dbgWin != null && window._dbgWin.closed) {
      window._dbgWin = undefined;
    }
    return window._dbgWin;
  }

  function isRealtime() {
    return getDbgWin().document.getElementById('realTime').checked;
  }

  function getCurrTime() {
    var t = new Date();
    return t.getHours() + ':' + t.getMinutes() + ':' + t.getSeconds() + '.' + t.getMilliseconds();
  }

  function isOn() {
    return getDbgWin() != null;
  }

  // TODO: add comments?
  function getCallstace() {
    try {
      (0)()
    } catch (e) {
      var mode = e.stack ? 'Firefox' : window.opera ? 'Opera' : 'Other';
      var ANON = '{anonymous}'

      switch (mode) {
        case 'Firefox' :
          return e.stack.replace(/^.*?\n/, '').
              replace(/(?:\n@:0)?\s+$/m, '').
              replace(/^\(/gm, ANON+'(').
              split("\n");

        case 'Opera' : {
          var lines = e.message.split("\n"),
              lineRE = /Line\s+(\d+).*?in\s+(http\S+)(?:.*?in\s+function\s+(\S+))?/i,
              i,j,len;

          for (i = 4,j = 0,len = lines.length; i < len; i += 2) {
            if (lineRE.test(lines[i])) {
              lines[j++] = (RegExp.$3 ?
                            RegExp.$3 + '()@' + RegExp.$2 + RegExp.$1 :
                            ANON + RegExp.$2 + ':' + RegExp.$1) +
                           ' -- ' + lines[i + 1].replace(/^\s+/, '');
            }
          }

          lines.splice(j, lines.length - j);
          return lines;
        }

        default : {
          var curr = arguments.callee.caller,
              FUNC = 'function',
              fnRE = /function\s*([\w\-$]+)?\s*\(/i,
              stack = [],j = 0,
              fn,args,i;

          while (curr) {
            fn = fnRE.test(curr.toString()) ? RegExp.$1 || ANON : ANON;
            if (fn == ANON) { // show func body as tooltip
              fn = '<span title="'+curr.toString()+'">' + fn + '</span>'
            }
            args = stack.slice.call(curr.arguments);
            i = args.length;

            while (i--) {
              switch (typeof args[i]) {
                case 'string'  : args[i] = '"' + args[i].replace(/"/g, '\\"') + '"'; break;
                case 'function': args[i] = FUNC; break;
              }
            }

            stack[j++] = fn + '(' + args.join() + ')';
            curr = curr.caller;
          }

          return stack;
        }
      }
    }
  }

  return {
    start: function() {
      if (!isOn()) {
        window._dbgWin = window.open('about:blank', '__DBGWIN__', 'width=600,height=600,resizable=yes,scrollbars=yes');
        window._dbgWin.document.writeln('<title>DEBUG</title>\n' +
                                        '<script>var _newContent = ""</script>\n' +
                                        '<Input type="Button" value="Clear" onClick="log.innerHTML = \'\'"/>\n' +
                                        '<Input type="Button" id="flush" value="Flush" onClick="window.opener.gw.Debug.flush()" style="display:none"/>\n' +
                                        '<Input type="checkbox" id="realTime" name="realTime" value="true" onClick="flush.style.display = this.checked ? \'none\' : \'\'" checked />Real time\n' +
                                        '<DIV id="log" style="width:95%;height:90%;overflow:auto"></DIV>');
      }
    },

    log: function(msg, bFlush) {
      if (isOn()) {
        var str = ('<li>[' + getCurrTime() + '] ' + msg + '<br>');
        if (bFlush || isRealtime()) {
          var logtxt = getDbgWin().document.getElementById('log');
          logtxt.innerHTML = logtxt.innerHTML + str;
          logtxt.scrollTop = logtxt.scrollHeight;
        } else {
          getDbgWin()._newContent += str;
        }
      }
    },

    flush : function () {
      var str = getDbgWin()._newContent;
      if (str) {
        gw.Debug.log(str, true);
        getDbgWin()._newContent = '';
      }
    },

    /**
     * Logs stack track
     * @param msg
     */
    stacktrace : function(msg) {
      if (isOn()) {
        var stack = getCallstace();
        stack.shift() // remove call to this function
        this.log(msg + '<table border=1 style="margin-left:20px"><tr><th>Stack trace</th></tr><tr><td>' +
                 stack.join('</td></tr><tr><td>') + '</td></tr></table>')
      }
    },
    /**
     * Externally expose our enum
     */
    EventLoggingEnum : loggingEnum,
    /**
     * Switch to turn on/off/full the event logging.
     * You can do this in the browser console via the commands:
     *
     *   gw.Debug.eventLogging = gw.Debug.EventLoggingEnum.OFF
     *   gw.Debug.eventLogging = gw.Debug.EventLoggingEnum.ON
     *   gw.Debug.eventLogging = gw.Debug.EventLoggingEnum.VERBOSE
     */
    eventLogging : loggingEnum.OFF,
    /**
     * Providing the name of events in this array will only log those
     * specific events. This has precedence over the ignored events.
     */
    eventLogOnlyEventsNamed : [],
    /**
     * Providing the name of events in this array will ignore log those
     * specific events. Since the pesky mouse events will
     * often flood the queue, ignore them by default.
     */
    eventLogIgnoreEventsNamed : ['mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover'],
    /**
     * Logs the ExtJs event
     * @param ename
     * @param scope
     * @param dom
     * @param fn
     * @param e
     */
    eventlog : function(ename, scope, dom, fn, e) {
      // see if logging is off or if there is no facility to log
      if (this.eventLogging === loggingEnum.OFF ||
          !(isOn() || (console && console.log))) {
        return;
      }

      function isSkippedEvent(ename) {
        var hasInclusion = (Array.isArray(gw.Debug.eventLogOnlyEventsNamed) && gw.Debug.eventLogOnlyEventsNamed.length);
        var hasExclusion = (Array.isArray(gw.Debug.eventLogIgnoreEventsNamed) && gw.Debug.eventLogIgnoreEventsNamed.length);
        if (hasInclusion) {
          return gw.Debug.eventLogOnlyEventsNamed.indexOf(ename) < 0;
        } else if (hasExclusion) {
          return gw.Debug.eventLogIgnoreEventsNamed.indexOf(ename) >= 0;
        }
        return false;
      }
      if (isSkippedEvent(ename)) {
        return;
      }

      function printAttributes(attributes) {
        var attrStr = "";
        if (attributes && attributes.length) {
          for (var i = 0; i < attributes.length; i++) {
            if (attributes[i].name !== 'id') {
              if (i > 0) {
                attrStr += "\n        ";
              }
              attrStr += attributes[i].name + " = " + attributes[i].value;
            }
          }
        }
        return attrStr ? attrStr : "<none>";
      }

      function printScope(scope) {
        var scopeStr = "";
        if (scope) {
          if (scope.id) {
            scopeStr += "id = " + scope.id;
          } else if (scope.$className) {
            scopeStr += "class = " + scope.$className;
          } else {
            scopeStr = scope.toString();
          }
        } else {
          "<unknown>"
        }
        return scopeStr;
      }

      var msg = "ename: " + ename + "\n" +
          "scope: " + printScope(scope) + "\n" +
          "dom: " + (dom.id ? dom.id : "<no id>") + "\n";
      if (this.eventLogging === loggingEnum.VERBOSE) {
        msg += "dom.attrs: " + printAttributes(dom.attributes) + "\n";
      }
      msg += "fn: " + fn.displayName + "\n" +
          "e: " + e.type + "\n" +
          "e.target: " + (e.target ? (e.target.id ? e.target.id : "<no id>") : "<none>");
      if (this.eventLogging === loggingEnum.VERBOSE && e.target) {
        msg += "\n" + "e.t.attrs: " + printAttributes(e.target.attributes);
      }

      if (isOn()) {
        this.log(msg, true);
      } else {
        console.log(msg);
      }
    }
  }
}()
