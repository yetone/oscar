;(function(window, undefined) {
  var arrProto = window.Array.prototype,
      def = window.Object.defineProperty,
      defs = window.Object.defineProperties,
      getObjKeys = window.Object.keys,
      isArray = window.Array.isArray;
  arrProto.has = function(obj) {
    return this.indexOf(obj) !== -1;
  };
  arrProto.add = function(obj) {
    if (!this.has(obj)) {
      this.push(obj);
    }
    return this;
  };
  arrProto.remove = function(obj, all) {
    var idx,
        self = this,
        remove = function() {
          idx = self.indexOf(obj);
          self.splice(idx, 1);
        };
    if (!self.has(obj)) {
      return self;
    }
    if (all === true) {
      while (self.has(obj)) {
        remove();
      }
      return self;
    } else {
      remove();
      return self;
    }
  };
  function toArray(obj) {
    return arrProto.slice.call(obj);
  }
  function runWithScope(code, scope) {
    return (new Function('with(this) {return (' + code + ');}')).call(scope);
  }
  function differ($A, $B) {
    if ($A.innerHTML === $B.innerHTML) {
      return false;
    }
    if ($A.childNodes.length !== $B.childNodes.length) {
      $A.innerHTML = $B.innerHTML;
      return true;
    }
    var $a, $b, needBind = false;
    for (var i = 0, l = $B.childNodes.length; i < l; i++) {
      $a = $A.childNodes[i];
      $b = $B.childNodes[i];
      if ($a.childNodes.length > 1) {
        needBind = differ($a, $b);
        continue;
      }
      if ($a.innerHTML !== $b.innerHTML) {
        $a.innerHTML = $b.innerHTML;
        if ($a.querySelectorAll('[oscar-bind]').length || $a.querySelectorAll('[oscar-bind]').length) {
          needBind = true;
        }
      } else {
        if ($a.innerHTML === undefined && $a.textContent !== $b.textContent) {
            $a.textContent = $b.textContent;
        }
      }
      if ($a.value !== $b.value) {
        $a.value = $b.value;
      }
    }
    return needBind;
  }
  var Model = (function() {
    function Model(obj) {
      this.$el = obj.$el;
      this.tpl = obj.tpl;
      this.data = obj.data;
      this.inited = obj.inited || false;
      this.eventObj = {};
    }
    var proto = Model.prototype;
    proto.on = function(e, cbk) {
      var self = this;
      if (self.eventObj[e] === undefined) {
        self.eventObj[e] = [];
      }
      self.eventObj[e].push(cbk);
    };
    proto.trigger = function(e) {
      var self = this;
      getObjKeys(self.eventObj).forEach(function(k) {
        if (k === e) {
          self.eventObj[k].forEach(function(cbk) {
            cbk.call(self);
          });
        }
      });
    };
    proto.watch = function(e, cbk) {
      var self = this;
      self.on('set:' + e, cbk);
      self.on('change:' + e, cbk);
      cbk();
    };
    proto.render = function() {
      function doRender($el) {
        var $childNodes = toArray($el.childNodes),
            attr = 'innerHTML';
        $childNodes.forEach(function($node) {
          switch ($node.nodeName.toLowerCase()) {
            case '#text':
              attr = 'textContent';
              break;
            case 'input':
              switch ($node.type) {
                case 'search':
                case 'text':
                  attr = 'value';
                  break;
                case 'checkbox':
                case 'radio':
                  attr = 'checked';
                  break;
              }
              break;
          }
          if ($node.hasAttribute === undefined) {

          }
          if ($node.childNodes.length) {
            doRender($node);
          }
        });
      }
      var self = this,
          $tmp = window.document.createElement('div'),
          html = window.shani.compile(self.tpl.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(new RegExp("'", 'g'), "\\'"))(self.data),
          needBind = false,
          $classes,
          $binds,
          $actions;
      $tmp.innerHTML = html;
      if (!self.inited) {
        self.$el.innerHTML = html;
        self.$el.style.display = 'block';
      } else {
        needBind = differ(self.$el, $tmp);
      }
      needBind = needBind || !self.inited;
      $classes = toArray(self.$el.querySelectorAll('[oscar-class]'));
      $binds = toArray(self.$el.querySelectorAll('[oscar-bind]'));
      $actions = toArray(self.$el.querySelectorAll('[oscar-action]'));
      // oscar-class
      $classes.forEach(function($c, i) {
        var cc = $c.getAttribute('oscar-class'),
            ccl;
        try {
          cc = cc.replace(new window.RegExp("'", 'g'), '"');
          ccl = runWithScope(cc, self.data);
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
      // oscar-bind
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
        var s = '(self.data' + c + ' = value)',
            eventType = 'input',
            dv = eval('(self.data' + c + ')');
        switch ($b.tagName.toLowerCase()) {
          case 'input':
            switch ($b.type) {
              case 'checkbox':
                eventType = 'change';
                $b.checked = dv;
                break;
              case 'radio':
                eventType = 'change';
                $b.checked = (dv === $b.value);
                break;
            }
            break;
          case 'select':
            eventType = 'change';
            var $opts = toArray($b.options),
                multiple = $b.hasAttribute('multiple');
            $opts.forEach(function($opt) {
              if (multiple) {
                $opt.selected = eval('(self.data' + c + '.has($opt.value))');
              } else {
                $opt.selected = (dv === $opt.value);
              }
            });
            break;
        }
        if (!needBind) return;
        $b.addEventListener(eventType, function() {
          var value = this.value;
          switch ($b.tagName.toLowerCase()) {
            case 'select':
              if ($b.hasAttribute('multiple')) {
                var acc = [],
                    $opts = toArray($b.selectedOptions);
                $opts.forEach(function($opt) {
                  acc.push($opt.value);
                });
                value = acc;
              }
              break;
            case 'input':
              switch ($b.type) {
                case 'checkbox':
                  value = this.checked;
                  break;
              }
              break;
          }
          eval(s);
        });
      });
      // oscar-bind end
      // oscar-action
      if (!needBind) return;
      $actions.forEach(function($a, i) {
        var ac = $a.getAttribute('oscar-action'),
            acl = /(\w+):(.*)/g.exec(ac);
        if (acl.length !== 3) return;
        $a.addEventListener(acl[1], function() {
          runWithScope(acl[2], self.data);
        });
      });
      // oscar-action end
      self.inited = true;
    };
    return Model;
  })();
  window.Oscar = (function() {
    function Oscar() {
      this.modelList = [];
      this.__init__();
    }
    var proto = Oscar.prototype;
    proto.__init__ = function() {
    };
    proto.buildArray = function(arr, model) {
      var self = this,
          args;
      ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(function(method) {
        arr[method] = function() {
          args = toArray(arguments);
          _args = toArray(arguments);
          if (method === 'splice') {
            var subArgs = args.slice(2);
            self.buildObj([subArgs], model);
            args = args.slice(0, 2);
            arrProto.push.apply(args, subArgs);
          } else {
            self.buildObj(args, model);
          }
          arrProto[method].apply(this, args);
          arrProto[method].apply(this.__c__, _args);
          self.buildObj(this, model);
          if (model !== undefined) {
            model.render();
          }
        };
      });
      self.buildObj(arr, model);
    };
    proto.buildObj = function(obj, model) {
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
          self.buildArray(obj[k], model);
        }
        if (obj[k].constructor === window.Object) {
          self.buildObj(obj[k], model);
        }
        properties[k] = {
          get: function() {
            return this.__c__[k];
          },
          set: function(v) {
            switch(v.constructor) {
              case window.Array:
                self.buildArray(v, model);
                break;
              case window.Object:
                self.buildObj(v, model);
                break;
            }
            this.__c__[k] = v;
            if (model !== undefined) {
              model.trigger('change:' + k);
              model.render();
            }
          }
        }
        if (model !== undefined) {
          model.trigger('set:' + k);
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
      var $el = $els[0],
          $binds = toArray($el.querySelectorAll('[oscar-bind]')),
          model;
      $binds.forEach(function($b) {
        var v = $b.getAttribute('oscar-bind');
        $b.getAttribute('value') || $b.setAttribute('value', '{{' + v + '}}');
      });
      model = new Model({
        $el: $el,
        tpl: $el.innerHTML,
        data: obj.data
      });
      this.buildObj(model.data, model);
      this.modelList.push(model);
      model.render();
      return model;
    };
    proto.watcher = function() {
      var self = this;
      self.modelList.forEach(function(model) {
        model.render();
      });
    };
    return Oscar;
  })();
})(window);
