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
    try {
      return arrProto.slice.call(obj);
    } catch(e) {
      console.log(e);
    }
  }
  function runWithScope(code, scope) {
    return (new Function('with(this) {return (' + code + ');}')).call(scope);
  }
  function genPrefix(prefix, k) {
    if (prefix.length === 0) return k;
    return prefix + '.' + k;
  }
  function getEvalString(txt) {
    return txt.replace(/\n/g, '')
              .replace(/\{\{/g, '\' + (')
              .replace(/\}\}/g, ') + \'')
              .replace(/^/g, '\'')
              .replace(/$/g, '\'');
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
    proto.getBindValues = function(txt) {
      var self = this,
          m = txt.match(/\{\{.*?\}\}/g),
          keys = getObjKeys(self.data),
          bvs = [],
          m0;
      if (!m) return bvs;
      m.forEach(function(str) {
        str = str.substr(2, str.length - 4).trim();
        m0 = str.match(/[a-zA-Z_][a-zA-Z0-9_]*/g);
        m0.forEach(function(str0) {
          if (keys.has(str0)) {
            bvs.add(str0);
          }
        });
      });
      return bvs;
    };
    proto.render = function($el) {
      $el = $el || this.$el;
      var self = this,
          $childNodes = toArray($el.childNodes),
          attr = 'innerHTML',
          es = '',
          bind,
          bindValues;
      $childNodes.forEach(function($node) {
        if ($node.childNodes.length) {
          self.render($node);
          return;
        }
        switch ($node.nodeName.toLowerCase()) {
          case '#text':
            attr = 'textContent';
            break;
          case 'input':
            attr = 'value';
            switch ($node.type) {
              case 'checkbox':
              case 'radio':
                bind = 'checked';
                break;
            }
            break;
          case 'select':
            attr = 'value';
            break;
        }
        bind = bind || attr;
        if ($node.hasAttribute === undefined) {
          if ($node.textContent.trim().length === 0) return;
          bindValues = self.getBindValues($node.textContent);
          es = getEvalString($node.textContent);
          bindValues.forEach(function(bv) {
            (function(es) {
              self.watch(bv, function() {
                $node.textContent = runWithScope(es, self.data);
              });
            })(es);
          });
          return;
        }
        if ($node.hasAttribute('oscar-bind')) {
          es = $node.getAttribute('oscar-bind');
          bindValues = self.getBindValues('{{' + es + '}}');
          bindValues.forEach(function(bv) {
            (function(bind, es) {
              self.watch(bv, function() {
                $node[bind] = runWithScope(es, self.data);
              });
            })(bind, es);
          });
        }
        if ($node.hasAttribute('oscar-class')) {
          var ocls = $node.getAttribute('oscar-class');
          bindValues = self.getBindValues('{{' + ocls + '}}');
          bindValues.forEach(function(bv) {
            self.watch(bv, function() {
              var classObj = runWithScope('(' + ocls + ')', self.data);
              getObjKeys(classObj).forEach(function(cls) {
                if (classObj[cls] === true) {
                  $node.classList.add(cls);
                } else {
                  $node.classList.remove(cls);
                }
              });
            });
          });
        }
        if ($node.hasAttribute('oscar-action')) {
          var oact = $node.getAttribute('oscar-action'),
              acl = /(\w+):(.*)/g.exec(oact);
          if (acl.length === 3) {
            $node.addEventListener(acl[1], function() {
              runWithScope(acl[2], self.data);
            });
          }
        }
        console.log($node, attr);
        if ($node[attr].trim().length === 0) return;
        bindValues = self.getBindValues($node[attr]);
        es = getEvalString($node[attr]);
        bindValues.forEach(function(bv) {
          (function(attr, es) {
            self.watch(bv, function() {
                $node[attr] = runWithScope(es, self.data);
            });
          })(attr, es);
        });
      });
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
    proto.buildArray = function(arr, model, k) {
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
            model.trigger('change:' + k);
            //model.render();
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
          self.buildArray(obj[k], model, k);
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
                self.buildArray(v, model, k);
                break;
              case window.Object:
                self.buildObj(v, model);
                break;
            }
            this.__c__[k] = v;
            if (model !== undefined) {
              model.trigger('change:' + k);
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
