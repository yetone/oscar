;(function(window, undefined) {
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
          propertyList = [],
          properties,
          args;
      function build(arr) {
        var propertyList = [];
        for (var i in arr.__c__) {
          if (!arr.hasOwnProperty(i)) continue;
          if (typeof arr[i] === 'function') continue;
          self.genPropertyList(propertyList, i);
        }
        properties = '({' + propertyList.join(', ') + '})';
        Object.defineProperties(arr, eval(properties));
      }
      function buildArgs(args) {
        var a;
        for (var i = 0, l = args.length; i < l; i++) {
          a = args[i];
          switch (a.constructor) {
            case (window.Array):
              self.buildArray(a);
              break;
            case (window.Object):
              self.buildData(a);
              break;
          }
        }
      }
      arr.__c__ = [];
      arr.push = function() {
        args = window.Array.prototype.slice.call(arguments);
        buildArgs(args);
        window.Array.prototype.push.apply(this, args);
        window.Array.prototype.push.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.pop = function() {
        args = window.Array.prototype.slice.call(arguments);
        window.Array.prototype.pop.apply(this, args);
        window.Array.prototype.pop.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.shift = function() {
        args = window.Array.prototype.slice.call(arguments);
        window.Array.prototype.shift.apply(this, args);
        window.Array.prototype.shift.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.unshift = function() {
        args = window.Array.prototype.slice.call(arguments);
        buildArgs(args);
        window.Array.prototype.unshift.apply(this, args);
        window.Array.prototype.unshift.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.splice = function() {
        args = window.Array.prototype.slice.call(arguments);
        var subArgs = args.slice(2);
        buildArgs([subArgs]);
        args = args.slice(0, 2);
        window.Array.prototype.push.apply(args, subArgs);
        window.Array.prototype.splice.apply(this, args);
        window.Array.prototype.splice.apply(this.__c__, args);
        build(this);
        self.watcher();
      };
      arr.__build = function() {
        build(this);
      };
      for (var i in arr) {
        if (!arr.hasOwnProperty(i)) continue;
        if (typeof arr[i] === 'function') continue;
        if (i === '__c__') continue;
        arr.__c__[i] = arr[i];
        self.genPropertyList(propertyList, i);
      }
      properties = '({' + propertyList.join(', ') + '})';
      Object.defineProperties(arr, eval(properties));
    };
    proto.genPropertyList = function(lst, k) {
      lst.push(k + ': {get: function() {return this.__c__[\'' + k + '\'];}, set: function(v) {if (v.constructor === window.Array) {self.buildArray(v)} if (v.constructor === window.Object) {self.buildData(v)} this.__c__[\'' + k + '\'] = v; self.watcher();}}');
    };
    proto.buildData = function(data) {
      var self = this,
          propertyList = [],
          properties;
      data.__c__ = {};
      for (var k in data) {
        if (!data.hasOwnProperty(k)) continue;
        if (k === '__c__') continue;
        data.__c__[k] = data[k];
        if (data[k].constructor === window.Array) {
          self.buildArray(data[k]);
        }
        if (data[k].constructor === window.Object) {
          self.buildData(data[k]);
        }
        self.genPropertyList(propertyList, k);
      }
      properties = '({' + propertyList.join(', ') + '})';
      Object.defineProperties(data, eval(properties));
    };
    proto.modelRegister = function(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new Error('invalid model type');
      }
      var $els = window.document.querySelectorAll(obj.el);
      if (!$els.length) {
        throw new Error('cannot find the element');
      }
      this.buildData(obj.data);
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
        $classes = e.$el.querySelectorAll('[oscar-class]');
        for (i = 0, l = $classes.length; i < l; i++) {
          var cc, ccl;
          $c = $classes[i];
          cc = $c.getAttribute('oscar-class');
          try {
            cc = cc.replace(new window.RegExp("'", 'g'), '"');
            ccl = (new Function('with(this){return (' + cc + ');}')).call(e.data);
          } catch(err) {
            console.log(err);
            break;
          }
          e.data.__$c__ = $c;
          for (var cls in ccl) {
            if (!ccl.hasOwnProperty(cls)) continue;
            if (ccl[cls]) {
              (new Function('with(this){(__$c__.classList.add(\'' + cls + '\'))}')).call(e.data);
            } else {
              (new Function('with(this){(__$c__.classList.remove(\'' + cls + '\'))}')).call(e.data);
            }
          }
        }
        // oscar-class end
        // oscar-bind
        $binds = e.$el.querySelectorAll('[oscar-bind]');
        for (var i = 0, l = $binds.length; i < l; i++) {
          var $b = $binds[i],
              bc = $b.getAttribute('oscar-bind'),
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
          var s = '(e.data' + c + '=this.value)';
          var eventType = 'input';
          if ($b.type === 'radio') {
            eventType = 'change';
          }
          if (!e.inited && needBind) {
            (new Function('with(this){($b.addEventListener(\'' + eventType + '\', function() {' + s + '}))}')).call({
              e: e,
              $b: $b
            });
          }
          (new Function('with(this){if (e.data' + c + ' === $b.value) {$b.hasOwnProperty(\'checked\');$b.checked = true;}}')).call({
            e: e,
            $b: $b
          });
        }
        // oscar-bind end
        if (e.inited && !needBind) return;
        // oscar-action
        $actions = e.$el.querySelectorAll('[oscar-action]');
        for (i = 0, l = $actions.length; i < l; i++) {
          var ac, acl, $a;
          $a = $actions[i];
          ac = $a.getAttribute('oscar-action');
          acl = /(\w+):(.*)/g.exec(ac);
          if (acl.length !== 3) continue;
          e.data.__$a__ = $a;
          (new Function('with(this){(__$a__.addEventListener(\'' + acl[1] + '\', function() {' + acl[2] + '}))}')).call(e.data);
        }
        // oscar-action end
        e.inited = true;
      });
    };
    return Oscar;
  })();
})(window);
