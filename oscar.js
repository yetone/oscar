;(function(window, undefined) {
  var arrProto = window.Array.prototype,
      strProto = window.String.prototype,
      objProto = window.Object.prototype,
      eventProto = window.Event.prototype,
      elProto = window.Element.prototype,
      hasProp = ({}).hasOwnProperty,
      forEach = arrProto.forEach,
      def = window.Object.defineProperty,
      defs = window.Object.defineProperties,
      getObjKeys = window.Object.keys,
      isArray = window.Array.isArray;
  // 补丁，为了某些浏览器
  (function() {
    if (!elProto.addEventListener) {
      elProto.addEventListener = function(type, listener) {
        var self = this,
            wrapper = function(e) {
              e.target = e.srcElement;
              e.currentTarget = self;
              if (listener.handleEvent) {
                listener.handleEvent(e);
              } else {
                listener.call(self, e);
              }
            };
        self.attachEvent('on' + type, wrapper);
      };
      elProto.removeEventListener = function(type, listener) {
        this.detachEvent('on' + type, listener);
      }
    }
    if (!def) {
      def = function(obj, prop, desc) {
        if ('__defineGetter__' in obj) {
          if ('value' in desc) {
            obj[prop] = desc.value;
          }
          if ('get' in desc) {
            obj.__defineGetter__(prop, desc.get);
          }
          if ('set' in desc) {
            obj.__defineSetter__(prop, desc.set);
          }
          return obj;
        }
      };
      defs = function(obj, descs) {
        for (var prop in descs) {
          if (!descs.hasOwnProperty(prop)) continue;
          def(obj, prop, descs[prop]);
        }
      };
    }
    if (!isArray) {
      isArray = function(obj) {
        try {
          return typeof obj === 'object' && toArray(obj).length === obj.length;
        } catch(e) {
          return false;
        }
      };
    }
  })();
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
  strProto.splice = function(start, length, replacement) {
    return this.substr(0, start) + replacement + this.substr(start + length);
  };
  objProto.extend = function(obj) {
    for (var k in obj) {
      this[k] = obj[k];
    }
  };
  function underAttribute($node, attr) {
    if ($node.parentElement.hasAttribute(attr)) return true;
    if ($node.tagName === 'BODY') {
      return $node.hasAttribute(attr);
    } else {
      return underAttribute($node.parentNode, attr);
    }
  }
  function isObj(obj) {
    try {
      return obj && obj.constructor === window.Object;
    } catch(e) {
      return typeof obj === 'object' && !isArray(obj);
    }
  }
  function isFunction(obj) {
    try {
      return obj && obj.constructor === window.Function;
    } catch(e) {
      return typeof obj === 'function';
    }
  }
  function isStr(obj) {
    try {
      return obj && obj.constructor === window.String;
    } catch(e) {
      return typeof obj === 'string';
    }
  }
  function toArray(obj) {
    return arrProto.slice.call(obj);
  }
  function range(s, e, d) {
    d = d || 1;
    var acc = [];
    for (; s < e; s += d) {
      acc.push(s);
    }
    return acc;
  }
  function extend(a, b) {
    var obj = {};
    for (var k in a) {
      obj[k] = a[k];
    }
    for (var k in b) {
      obj[k] = a[k];
    }
    return obj;
  }
  function _extends(child, parent) {
    function fix() {
      this.constructor = child;
    }
    for (var k in parent) {
      if (hasProp.call(parent, k)) child[k] = parent[k];
    }
    fix.prototype = parent.prototype;
    child.prototype = new fix();
    child.__super__ = parent.prototype;
    return child;
  }
  function getWindow() {
    return (new Function('return this;'))();
  }
  function getObjValues(obj) {
    var acc = [];
    for (var k in obj) {
      if (!hasProp.call(obj, k)) continue;
      // must use push
      acc.push(obj[k]);
    }
    return acc;
  }
  function parseEvalStr(txt) {
    var acc = [],
        strL = [],
        obj = {},
        dquoteCount = 0,
        squoteCount = 0,
        bi,
        ei,
        str;
    for (var i = 0, l = txt.length; i < l; i++) {
      var c = txt.charAt(i),
          substr;
      if (squoteCount + dquoteCount === 0) {
        if (/[a-zA-Z0-9_$]/.test(c)) {
          if (bi === undefined) {
            bi = i;
          }
          if (i === l - 1) {
            ei = l;
            substr = txt.substr(bi, ei - bi);
            acc.push(substr);
            strL.push(acc.join('.'));
            obj[bi] = substr;
            bi = undefined;
          }
        } else {
          if (bi !== undefined) {
            ei = i;
            substr = txt.substr(bi, ei - bi);
            acc.push(substr);
            if (!/[\.\[\]'"]/.test(c)) {
              str = acc.join('.');
              if (str) {
                strL.push(str);
                acc = [];
              }
            }
            obj[bi] = substr;
            bi = undefined;
          }
        }
      } else {
        if (bi !== undefined) {
          ei = i;
          substr = txt.substr(bi, ei - bi);
          //acc.push(substr);
          obj[bi] = substr;
          bi = undefined;
        }
        str = acc.join('.');
        if (str) {
          strL.push(str);
          acc = [];
        }
      }
      if (c === '\'') {
        if (txt.charAt(i + 1) === ']') continue;
        if (txt.charAt(i - 1) === '[') continue;
        if (squoteCount === 0) {
          squoteCount++;
        } else {
          squoteCount--;
        }
      }
      if (c === '"') {
        if (txt.charAt(i + 1) === ']') continue;
        if (txt.charAt(i - 1) === '[') continue;
        if (dquoteCount === 0) {
          dquoteCount++;
        } else {
          dquoteCount--;
        }
      }
    }
    obj['strL'] = strL;
    return obj;
  }
  function replaceEvalStr(txt, searchstr, newstr) {
    var map = parseEvalStr(txt),
        keys = Object.keys(map),
        dlt = 0;
    keys.sort(function(a, b) {
      return (a | 0) > (b | 0);
    });
    keys.forEach(function(k) {
      k = +k;
      if (isNaN(k)) return;
      if (map[k] === searchstr) {
        txt = txt.splice(k + dlt, searchstr.length, newstr);
        dlt = dlt + newstr.length - searchstr.length;
      }
    });
    return txt;
  }
  function runWithScope(code, scope) {
    return (new Function('with(this) {return (' + code + ');}')).call(scope);
  }
  function runWithEvent(code, scope, target, event) {
    scope.$this = target;
    scope.$event = event;
    return (new Function('scope', 'with(scope) {return (' + code + ');}')).call(this, scope);
  }
  function genPath(base, k) {
    function parse(str) {
      return str.replace(/\[['"]/g, '[').replace(/['"]\]/g, ']').replace(/\[|\]\[|\]\./g, '.').replace(/'\.'|'\.|\.'/g, '.').replace(/\]$/, '').replace(/'$/, '');
    }
    if (k === undefined) return parse(base);
    if (base.length === 0) return parse(k);
    return parse(base) + '.' + parse(k);
  }
  function genS(str) {
    var strl = str.split('.'),
        s = '';
    for (var x in strl) {
      if (!strl.hasOwnProperty(x)) continue;
      s += '[\'' + strl[x] + '\']';
    }
    return s;
  }
  function getEvalString(txt) {
    if (txt.indexOf('{{') < 0) return;
    return txt.replace(/\n/g, '')
              .replace(/\{\{/g, '\' + (')
              .replace(/\}\}/g, ') + \'')
              .replace(/^/g, '\'')
              .replace(/$/g, '\'');
  }
  function parseExp(exp) {
    return exp.replace(/\sand\s/g, ' && ')
              .replace(/\sor\s/g, ' || ');
  }
  function getBind($node) {
    var bind;
    switch ($node.nodeName.toLowerCase()) {
      case 'input':
        bind = 'value';
        switch ($node.type) {
          case 'radio':
          case 'checkbox':
            bind = 'checked';
            break;
        }
        break;
      case 'select':
        bind = 'value';
        break;
    }
    return bind;
  }
  function getEventType($node) {
    var eventType = 'input';
    switch ($node.nodeName.toLowerCase()) {
      case 'input':
        switch ($node.type) {
          case 'checkbox':
          case 'radio':
            eventType = 'change';
            break;
        }
        break;
      case 'select':
        eventType = 'change';
        break;
    }
    return eventType;
  }
  var Store = (function() {
    function Store() {
      this.__c__ = {
        length: {
          value: 0
        }
      };
    }
    var proto = Store.prototype;
    proto.set = function(k, v) {
      var self = this,
          len = self.__c__['length'].value;
      self.__c__[k] = {
        value: v
      };
      self.setIndex(k, len);
      self.__c__['length'].value++;
    };
    proto.get = function(k) {
      var self = this,
          c = self.__c__[k];
      if (!c || c.removed) return undefined;
      return c.value;
    };
    proto.delete = function(k) {
      var self = this,
          c = self.__c__[k];
      if (!c) return false;
      c.removed = true;
      self.__c__['length'].value--;
    };
    proto.setIndex = function(k, idx) {
      var self = this,
          c = self.__c__[k];
      if (!c || c.removed) return false;
      c.index = idx;
    };
    proto.getIndex = function(k) {
      var self = this,
          c = self.__c__[k];
      if (!c || c.removed) return undefined;
      return c.index;
    };
    proto.toObj = function() {
      var self = this,
          obj = {};
      for (var k in self.__c__) {
        if (!hasProp.call(self.__c__, k)) continue;
        if (!self.__c__[k] || self.__c__[k].removed) continue;
        obj[k] = self.__c__[k].value;
      }
      return obj;
    };
    proto.toArray = function() {
      var self = this,
          obj = self.toObj();
      return toArray(obj);
    };
    proto.fixIndex = function() {
      var self = this,
          i = 0;
      forEach.call(self.toArray(), function(v, k) {
        self.setIndex(k, i++);
      });
    };
    proto.apply = function() {
      return '大杀器';
    };
    return Store;
  })();
  var Observer = (function() {
    function Observer() {
      this.eventHandlerObj = {};
    }
    var proto = Observer.prototype;
    proto.on = function(eventType, cbk) {
      if (!isFunction(cbk)) {
        throw new Error('eventHandler must be a function');
      }
      var self = this;
      if (!(eventType in self.eventHandlerObj)) {
        self.eventHandlerObj[eventType] = [];
      }
      self.eventHandlerObj[eventType].push(cbk);
      return self;
    };
    proto.off = function(eventType, fun) {
      var self = this;
      if (!(eventType in self.eventHandlerObj)) {
        return self;
      }
      self.eventHandlerObj[eventType] = self.eventHandlerObj[eventType].filter(function(item) {
        return item !== fun;
      });
      return self;
    };
    proto.trigger = function(e) {
      var self = this,
        handlerArgs = window.Array.prototype.slice(arguments, 1);
      if (e in self.eventHandlerObj) {
        self.eventHandlerObj[e].forEach(function(cbk) {
          cbk && cbk.apply(self, handlerArgs);
        });
      }
      return self;
    };
    proto.watch = function(el, cbk) {
      var self = this;
      if (isStr(el)) {
        el = el.split(' ');
      }
      forEach.call(el, function(e) {
        self.on('set:' + e, cbk);
        self.on('change:' + e, cbk);
        self.on('change:' + genPath(e, '__index__'), cbk);
      });
      cbk();
    };
    return Observer;
  })();
  var Model = (function(_super) {
    _extends(Model, _super);
    function Model(obj) {
      this.$el = obj.$el;
      this.tpl = obj.tpl;
      this.data = obj.data;
      this.inited = obj.inited || false;

      return Model.__super__.constructor.apply(this, arguments);
    }
    var proto = Model.prototype;
    proto.getBindValues = function(txt) {
      var m = txt.match(/\{\{.*?\}\}/g),
          bvs = [],
          pl;
      if (!m) return bvs;
      m.forEach(function(str) {
        str = str.substr(2, str.length - 4).trim();
        pl = parseEvalStr(str).strL;
        pl.forEach(function(v){
          bvs.add(v);
          var lst = v.split('.');
          for(var i = 1; i < lst.length; i++){
            bvs.add(lst.slice(0, -i).join('.'));
          }
        })
      });
      return bvs;
    };
    proto.render = function($node, scope) {
      $node = $node || this.$el;
      scope = scope || this.data;
      var self = this,
          bind, eventType, multiple, hasBind, hasClass, hasAction, hasIf, hasFor, path,
          bindValue, bindValues, attrs;
      function _bind(obj, attr) {
        var bindValues = self.getBindValues(obj[attr], scope),
            es = getEvalString(obj[attr]);
        if (es) {
          self.watch(bindValues, function() {
            try {
              obj[attr] = runWithScope(es, scope);
            } catch(e) {
              console.log(e);
            }
          });
        }
      }
      if ($node.nodeType === 3) {
        return _bind($node, 'textContent');
      }
      bind = getBind($node);
      eventType = getEventType($node);
      multiple = $node.hasAttribute('multiple');
      hasBind = $node.hasAttribute('oscar-bind');
      hasClass = $node.hasAttribute('oscar-class');
      hasAction = $node.hasAttribute('oscar-action');
      hasIf = $node.hasAttribute('oscar-if');
      hasFor = $node.hasAttribute('oscar-for');
      attrs = toArray($node.attributes);
      attrs = attrs.filter(function(v) {
        return v.name.indexOf('oscar-') !== 0;
      });
      attrs.forEach(function(v) {
        _bind(v, 'value');
      });
      if (hasFor && !$node.inited) {
        var $tmp = $node,
            $ps = $node.previousSibling,
            $ns = $node.nextSibling,
            $pn = $node.parentNode,
            $cns = $node.childNodes,
            exp = $node.getAttribute('oscar-for'),
            expl = /([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(exp),
            acc = [];
        if (!expl && expl.length !== 3) return;
        function render() {
          var dv = eval('(scope' + genS(expl[2]) + ')'),
              obj = dv;
          if (isObj(dv)) {
            obj = getObjKeys(dv);
          }
          $node.remove();
          obj.forEach(function(v, k) {
            if (isObj(dv) && v === '__c__') return;
            var $node,
                re = /\{\{(.*?)\}\}/g,
                idx = k,
                kstr = '$index';
            if (isObj(dv)) {
              idx = v;
              kstr = '$key';
            }
            if (acc[idx]) {
              $node = acc[idx]['$node'];
            } else {
              $node = $tmp.cloneNode(true);
              // 起名什么的最讨厌了！
              (function __($node) {
                if ($node.nodeType === 3) {
                  $node.textContent = $node.textContent.replace(re, function(_, a) {
                    a = replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                    a = replaceEvalStr(a, kstr, '\'' + idx + '\'');
                    return '{{' + a + '}}';
                  });
                  return;
                }
                var oscarAttrs = ['bind', 'action', 'class', 'if'],
                    attrs = toArray($node.attributes),
                    preffix = 'oscar-',
                    $cns = toArray($node.childNodes);
                oscarAttrs.forEach(function(_attr) {
                  var attr = preffix + _attr,
                    a;
                  if ($node.hasAttribute(attr)) {
                    a = $node.getAttribute(attr);
                    a = replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                    a = replaceEvalStr(a, kstr, '\'' + idx + '\'');
                    $node.setAttribute(attr, a);
                  }
                });
                attrs = attrs.filter(function(v) {
                  return v.name.indexOf('oscar-') !== 0;
                });
                attrs.forEach(function(v) {
                  v.value = v.value.replace(re, function(_, a) {
                    a = replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                    a = replaceEvalStr(a, kstr, '\'' + idx + '\'');
                    return '{{' + a + '}}';
                  });
                });
                $cns.forEach(function($n) {
                  __($n);
                });
              })($node);
              acc.push({
                $node: $node
              });
            }

            if (window.document.contains($node)) return;
            if ($ns) {
              $pn.insertBefore($node, $ns);
            } else if ($ps && $ps.nextSibling) {
              $pn.insertBefore($node, $ps.nextSibling);
            } else if ($pn) {
              $pn.appendChild($node);
            }
            $ps = $node.previousSibling;
            $ns = $node.nextSibling;
            $pn = $node.parentNode;
            $cns = $node.childNodes;
            var attrs = toArray($node.attributes).filter(function(v) {
              return v.name.indexOf('oscar-') !== 0;
            });
            attrs.forEach(function(v) {
              _bind(v, 'value');
            });
            self.watch(bindValues, function() {
              var dv = eval('(scope' + genS(expl[2]) + ')'),
                hasMe;
              if (isObj(dv)) {
                hasMe = v in dv;
              } else {
                hasMe = k in dv;
              }
              if (!hasMe) {
                $node.remove();
              }
            });
            $node.inited = true;
            self.render($node);
          });
        }
        bindValues = self.getBindValues('{{' + expl[2] + '}}', scope);
        self.watch(bindValues, function() {
          render();
        });
        return;
      }
      if (hasBind && bind) {
        bindValue = $node.getAttribute('oscar-bind');
        path = genPath(bindValue);
        if (multiple) {
          self.watch(path, function() {
            var $opts = toArray($node.options);
            $opts.forEach(function($opt) {
              $opt.selected = eval('(scope' + genS(path) + '.indexOf($opt.value) >= 0)');
            });
          });
          if (eventType) {
            $node.addEventListener(eventType, function() {
              var $selectedOpts = toArray($node.selectedOptions),
                acc = [],
                es;
              $selectedOpts.forEach(function($opt) {
                if ($opt.selected) {
                  acc.push($opt.value);
                }
              });
              es = '(scope' + genS(path) + ' = acc)';
              eval(es);
            });
          }
        } else {
          self.watch(path, function() {
            if ($node.type === 'radio') {
              $node[bind] = eval('(scope' + genS(path) + ' === $node.value)');
            } else {
              $node[bind] = runWithScope(bindValue, scope);
            }
          });
          if (path !== path.split('.')[0]) {
            self.watch(path.split('.')[0], function() {
              $node[bind] = runWithScope(bindValue, scope);
            });
          }
          if (eventType) {
            $node.addEventListener(eventType, function() {
              var es;
              if ($node.type === 'radio') {
                es = '(scope.' + bindValue + ' = this.value)';
              } else {
                es = '(scope.' + bindValue + ' = this.' + bind + ')';
              }
              eval(es);
            });
          }
        }
      }
      if (hasClass) {
        var ocls = $node.getAttribute('oscar-class');
        bindValues = self.getBindValues('{{' + ocls + '}}', scope);
        self.watch(bindValues, function() {
          var classObj = runWithScope('(' + ocls + ')', scope);
          getObjKeys(classObj).forEach(function(cls) {
            if (classObj[cls] === true) {
              $node.classList.add(cls);
            } else {
              $node.classList.remove(cls);
            }
          });
        });
      }
      if (hasAction) {
        var oact = $node.getAttribute('oscar-action'),
          acl = /(\w+):(.*)/g.exec(oact);
        if (acl.length === 3) {
          $node.addEventListener(acl[1], function(e) {
            runWithEvent(acl[2], scope, this, e);
          });
        }
      }
      if (hasIf) {
        var exp = parseExp($node.getAttribute('oscar-if')),
            $tmp = $node,
            $ps = $node.previousSibling,
            $ns = $node.nextSibling,
            $pn = $node.parentNode,
            removed = false;
        bindValues = self.getBindValues('{{' + exp + '}}', scope);
        self.watch(bindValues, function() {
          if (runWithScope(exp, scope)) {
            if (!removed) return;
            var $node0 = $tmp;
            if ($ps && $ps.nextSibling) {
              $pn.insertBefore($node0, $ps.nextSibling);
            } else if ($ns) {
              $pn.insertBefore($node0, $ns);
            } else if ($pn) {
              $pn.appendChild($node0);
            }
            self.render($node0, null, true);
            $node = $node0;
            $tmp = $node;
            removed = false;
          } else {
            $node.remove();
            removed = true;
          }
        });
      }
      if (window.document.contains($node)) {
        toArray($node.childNodes).forEach(function($node) {
          self.render($node);
        });
      }
    };
    return Model;
  })(Observer);
  window.Oscar = (function() {
    function Oscar() {
      this.modelList = [];
      this.__init__();
    }
    var proto = Oscar.prototype;
    proto.__init__ = function() {
    };
    proto.buildArray = function(arr, model, root) {
      root = root || '';
      var self = this,
          args;
      ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(function(method) {
        arr[method] = function() {
          var oldL = this.length;
          args = toArray(arguments);
          // clone arguments
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
          this.__c__.apply(method, _args);
          self.buildObj(this, model, root);
          if (model !== undefined) {
            model.trigger('change:' + root);
            model.trigger('change:*');
            if (oldL !== this.length) {
              model.trigger('change:' + genPath(root, '__index__'));
            }
          }
        };
      });
      self.buildObj(arr, model, root);
    };
    proto.buildObj = function(obj, model, root) {
      root = root || '';
      var self = this,
          properties = {};
      if (obj.__c__ === undefined || obj.__c__.constructor !== Store) {
        obj.__c__ = new Store();
      }
      getObjKeys(obj).forEach(function(k) {
        if (k === '__c__') return;
        if (typeof obj[k] === 'function') return;
        obj.__c__.set(k, obj[k]);
        var path = genPath(root, k);
        if (isArray(obj[k])) {
          self.buildArray(obj[k], model, path);
        }
        if (isObj(obj[k])) {
          self.buildObj(obj[k], model, path);
        }
        properties[k] = {
          get: function() {
            return this.__c__.get(k);
          },
          set: function(v) {
            if (isArray(v)) {
              self.buildArray(v, model, path);
            }
            if (isObj(v)) {
              self.buildObj(v, model, path);
            }
            var isNew = (this.__c__.get(k) !== v);
            this.__c__.set(k, v);
            if (model !== undefined && isNew) {
              model.trigger('change:' + path);
              model.trigger('change:*');
            }
          }
        };
        if (model !== undefined) {
          model.trigger('set:' + path);
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
          model;
      model = new Model({
        $el: $el,
        tpl: $el.innerHTML,
        data: obj.data
      });
      this.buildObj(model.data, model);
      this.modelList.push(model);
      model.render();
      model.inited = true;
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
})((new Function('return this;'))());
