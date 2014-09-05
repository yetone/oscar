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
        throw new Error('invailed model type');
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
        $e.setAttribute('value', '{{' + v + '}}');
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
            html = window.shani.compile(e.tpl.replace(/&gt;/g, '>').replace(/&lt;/g, '<'))(e.data),
            needBind,
            $binds,
            $actions;
        $tmp.innerHTML = html;
        if (!e.inited) {
          e.$el.innerHTML = html;
        } else {
          needBind = proto.utils.differ(e.$el, $tmp);
        }
        if (e.inited && !needBind) return;
        $binds = e.$el.querySelectorAll('[oscar-bind]');
        for (var i = 0, l = $binds.length; i < l; i++) {
          var $e = $binds[i],
              wc = $e.getAttribute('oscar-bind'),
              c = '',
              wcl;
          wc = wc.replace(/(\[|\])/g, '.');
          if (wc.lastIndexOf('.') === wc.length - 1) {
            wc = wc.substr(0, wc.length - 1);
          }
          wcl = wc.split('.');
          for (var x in wcl) {
            if (!wcl.hasOwnProperty(x)) continue;
            c += '[\'' + wcl[x] + '\']';
          }
          var s = '(e.data' + c + '=this.value)';
          (new Function('with(this){($e.addEventListener(\'input\', function() {' + s + '}))}')).call({
            e: e,
            $e: $e
          });
        }
        $actions = e.$el.querySelectorAll('[oscar-action]');
        for (i = 0, l = $actions.length; i < l; i++) {
          var as, asl;
          $e = $actions[i];
          as = $e.getAttribute('oscar-action');
          asl = /(\w+):(.*)/g.exec(as);
          if (asl.length !== 3) continue;
          e.data.$e = $e;
          (new Function('with(this){($e.addEventListener(\'' + asl[1] + '\', function() {' + asl[2] + '}))}')).call(e.data);
        }
        e.inited = true;
      });
    };
    return Oscar;
  })();
})(window);
