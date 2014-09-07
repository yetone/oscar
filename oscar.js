;(function(window, undefined) {
  var arrProto = window.Array.prototype,
      def = window.Object.defineProperty,
      defs = window.Object.defineProperties,
      getObjKeys = window.Object.keys,
      isArray = window.Array.isArray;
  function toArray(obj) {
    return arrProto.slice.call(obj);
  }
  function runWithScope(code, scope) {
    return (new Function('with(this) {return (' + code + ');}')).call(scope);
  }
  window.Oscar = (function() {
    function Oscar() {
      this.modelList = [];
      this.__init__();
    }
    var proto = Oscar.prototype;
    proto.__init__ = function() {
    };
    proto.buildArray = function(arr) {
      var self = this,
          args;
      ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(function(method) {
        arr[method] = function() {
          args = toArray(arguments);
          _args = toArray(arguments);
          if (method === 'splice') {
            var subArgs = args.slice(2);
            self.buildObj([subArgs]);
            args = args.slice(0, 2);
            arrProto.push.apply(args, subArgs);
          } else {
            self.buildObj(args);
          }
          arrProto[method].apply(this, args);
          arrProto[method].apply(this.__c__, _args);
          self.buildObj(this);
          self.watcher();
        };
      });
      self.buildObj(arr);
    };
    proto.buildObj = function(obj) {
      var self = this,
          properties = {};
      if (obj.__c__ === undefined) {
        if (isArray(obj)) {
          obj.__c__ = [];
        } else {
          obj.__c__ = {};
        }
      }
      getObjKeys(obj).forEach(function(k) {
        if (k === '__c__') return;
        if (typeof obj[k] === 'function') return;
        obj.__c__[k] = obj[k];
        if (obj[k].constructor === window.Array) {
          self.buildArray(obj[k]);
        }
        if (obj[k].constructor === window.Object) {
          self.buildObj(obj[k]);
        }
        properties[k] = {
          get: function() {
            return this.__c__[k];
          },
          set: function(v) {
            switch(v.constructor) {
              case window.Array:
                self.buildArray(v);
                break;
              case window.Object:
                self.buildObj(v);
                break;
            }
            this.__c__[k] = v;
            self.watcher();
          }
        }
      });
      defs(obj, properties);
    };
    proto.modelRegister = function(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new Error('invalid model type');
      }
      var $els = window.document.querySelectorAll(obj.el);
      if (!$els.length) {
        throw new Error('cannot find the element');
      }
      this.buildObj(obj.data);
      var $el = $els[0],
          $binds = $el.querySelectorAll('[oscar-bind]');
      for (var i = 0, l = $binds.length; i < l; i++) {
        var $e = $binds[i],
            v = $e.getAttribute('oscar-bind');
        $e.getAttribute('value') || $e.setAttribute('value', '{{' + v + '}}');
      }
      this.modelList.push({
        $el: $el,
        tpl: $el.innerHTML,
        data: obj.data,
        inited: false
      });
      this.watcher();
    };
    proto.utils = {
      differ: function($A, $B) {
        if ($A.innerHTML === $B.innerHTML) return;
        var $a, $b, needBind = false;
        if ($A.childNodes.length !== $B.childNodes.length) {
          $A.innerHTML = $B.innerHTML;
          needBind = true;
        } else {
          for (var i = 0, l = $B.childNodes.length; i < l; i++) {
            $a = $A.childNodes[i];
            $b = $B.childNodes[i];
            if ($a.childNodes.length > 1) {
              proto.utils.differ($a, $b);
              continue;
            }
            if ($a.innerHTML !== $b.innerHTML) {
              $a.innerHTML = $b.innerHTML;
              if ($a.querySelectorAll('[oscar-bind]').length || $a.querySelectorAll('[oscar-bind]').length) {
                needBind = true;
              }
            } else {
              if ($a.innerHTML === undefined) {
                if ($a.textContent !== $b.textContent) {
                  $a.textContent = $b.textContent;
                }
              }
            }
            if ($a.value !== $b.value) {
              $a.value = $b.value;
            }
          }
        }
        return needBind;
      }
    };
    proto.watcher = function() {
      var self = this;
      self.modelList.forEach(function(e) {
        var $tmp = window.document.createElement('div'),
            html = window.shani.compile(e.tpl.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(new RegExp("'", 'g'), "\\'"))(e.data),
            needBind,
            $classes,
            $binds,
            $actions;
        $tmp.innerHTML = html;
        if (!e.inited) {
          e.$el.innerHTML = html;
          e.$el.style.display = 'block';
        } else {
          needBind = proto.utils.differ(e.$el, $tmp);
        }
        // oscar-class
        $classes = toArray(e.$el.querySelectorAll('[oscar-class]'));
        $classes.forEach(function($c, i) {
          var cc = $c.getAttribute('oscar-class'),
              ccl;
          try {
            cc = cc.replace(new window.RegExp("'", 'g'), '"');
            ccl = runWithScope(cc, e.data);
          } catch(err) {
            console.log(err);
            return;
          }
          getObjKeys(ccl).forEach(function(cls) {
            if (ccl[cls] === true) {
              $c.classList.add(cls);
            } else {
              $c.classList.remove(cls);
            }
          });
        });
        // oscar-class end
        if (e.inited && !needBind) return;
        // oscar-bind
        $binds = toArray(e.$el.querySelectorAll('[oscar-bind]'));
        $binds.forEach(function($b, i) {
          var bc = $b.getAttribute('oscar-bind'),
              c = '',
              bcl;
          bc = bc.replace(/(\[|\])/g, '.');
          if (bc.lastIndexOf('.') === bc.length - 1) {
            bc = bc.substr(0, bc.length - 1);
          }
          bcl = bc.split('.');
          for (var x in bcl) {
            if (!bcl.hasOwnProperty(x)) continue;
            c += '[\'' + bcl[x] + '\']';
          }
          var s = '(e.data' + c + ' = this.value)';
          var eventType = 'input';
          if ($b.type === 'radio') {
            eventType = 'change';
          }
          $b.addEventListener(eventType, function() {
            eval(s);
          });
          if (eval('(e.data' + c + ' === $b.value)')) {
            $b.hasOwnProperty('checked') && ($b.checked = true);
          }
        });
        // oscar-bind end
        // oscar-action
        $actions = toArray(e.$el.querySelectorAll('[oscar-action]'));
        $actions.forEach(function($a, i) {
          var ac = $a.getAttribute('oscar-action'),
              acl = /(\w+):(.*)/g.exec(ac);
          if (acl.length !== 3) return;
          $a.addEventListener(acl[1], function() {
            runWithScope(acl[2], e.data);
          });
        });
        // oscar-action end
        e.inited = true;
      });
    };
    return Oscar;
  })();
})(window);
