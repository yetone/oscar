;(function(window, undefined) {
  var arrProto = window.Array.prototype,
      strProto = window.String.prototype,
      objProto = window.Object.prototype,
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
    return obj && obj.constructor === window.Object;
  }
  function isFunction(obj) {
    return obj && obj.constructor === window.Function;
  }
  function isStr(obj) {
    return obj && obj.constructor === window.String;
  }
  function toArray(obj) {
    return arrProto.slice.call(obj);
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
  function getWindow() {
    return (new Function('return this;'))();
  }
  function parseEvalStr(txt, vlst) {
    var acc = [],
        obj = {},
        dquoteCount = 0,
        squoteCount = 0,
        bi,
        ei;
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
            obj[bi] = substr;
            bi = undefined;
          }
        } else {
          if (bi !== undefined) {
            ei = i;
            substr = txt.substr(bi, ei - bi);
            acc.push(substr);
            obj[bi] = substr;
            bi = undefined;
          }
        }
      } else {
        if (bi !== undefined) {
          ei = i;
          substr = txt.substr(bi, ei - bi);
          acc.push(substr);
          obj[bi] = substr;
          bi = undefined;
        }
      }
      if (c === '\'') {
        if (squoteCount === 0) {
          squoteCount++;
        } else {
          squoteCount--;
        }
      }
      if (c === '"') {
        if (dquoteCount === 0) {
          dquoteCount++;
        } else {
          dquoteCount--;
        }
      }
    }
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
      k = k | 0;
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
  function genPath(base, k) {
    function parse(str) {
      return str.replace(/\[|\]\[/g, '.').replace(/'\.'|'\.|\.'/g, '.').replace(/\]$/, '').replace(/'$/, '');
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
  var Model = (function() {
    function Model(obj) {
      this.$el = obj.$el;
      this.tpl = obj.tpl;
      this.data = obj.data;
      this.inited = obj.inited || false;
      this.eventHandlerObj = {};
    }
    var proto = Model.prototype;
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
    proto.watch = function(e, cbk) {
      var self = this;
      self.on('set:' + e, cbk);
      self.on('change:' + e, cbk);
      cbk();
    };
    proto.getBindValues = function(txt, scope) {
      scope = scope || this.data;
      var self = this,
          m = txt.match(/\{\{.*?\}\}/g),
          keys = getObjKeys(scope),
          bvs = [],
          m0;
      if (!m) return bvs;
      m.forEach(function(str) {
        str = str.substr(2, str.length - 4).trim();
        m0 = str.match(/[a-zA-Z_][a-zA-Z0-9_]*(\[['"]?[0-9a-zA-Z]+['"]?\])?/g);
        if (!m0) return;
        m0.forEach(function(str0) {
          var strl = str0.split(/\[|\]/);
          if (keys.has(strl[0])) {
            var path = str0.replace(/\[|\]\[/g, '.').replace(/'\.'|'\.|\.'/g, '.').replace(/\]$/, '').replace(/'$/, '');
            if (path !== path.split('.')[0]) {
              bvs.add(path.split('.')[0]);
            }
            bvs.add(path);
          }
        });
      });
      return bvs;
    };
    proto.render = function($el, scope) {
      $el = $el || this.$el;
      scope = scope || this.data;
      var self = this,
          $childNodes = toArray($el.childNodes);
      function _bind(obj, attr) {
        var bindValues = self.getBindValues(obj[attr], scope),
            es = getEvalString(obj[attr]);
        if (es) {
          bindValues.forEach(function(path) {
            self.watch(path, function() {
              try {
                obj[attr] = runWithScope(es, scope);
              } catch(e) {
                console.log(e);
              }
            });
          });
        }
      }
      $childNodes.forEach(function($node) {
        if ($node.hasChildNodes()) {
          self.render($node);
        }
        var bind, eventType, multiple, hasBind, hasClass, hasAction, hasIf, hasFor, path,
            bindValue, bindValues, attrs;
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
          bindValues.forEach(function(path) {
            self.watch(path, function() {
              var classObj = runWithScope('(' + ocls + ')', scope);
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
        if (hasAction) {
          var oact = $node.getAttribute('oscar-action'),
              acl = /(\w+):(.*)/g.exec(oact);
          if (acl.length === 3) {
            $node.addEventListener(acl[1], function() {
              runWithScope(acl[2], scope);
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
          bindValues.forEach(function(path) {
            self.watch(path, function() {
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
          });
        }
        if (hasFor) {
          var $tmp = $node,
              $ps = $node.previousSibling,
              $ns = $node.nextSibling,
              $pn = $node.parentNode,
              $cns = $node.childNodes,
              exp = $node.getAttribute('oscar-for'),
              expl = /([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(exp),
              acc = [];
          if (expl && expl.length === 3) {
            bindValues = self.getBindValues('{{' + expl[2] + '}}', scope);
            if (!self.inited) {
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
                      _bindValues,
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
                  _bindValues = self.getBindValues($node.innerHTML);
                  _bindValues.forEach(function(path) {
                    self.watch(path, function() {
                      self.render($node);
                    });
                  });
                  bindValues.forEach(function(path) {
                    self.watch(path, function() {
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
                  });
                });
              }
              bindValues.forEach(function(bv) {
                self.watch(bv, function() {
                  render();
                });
              });
            }
          }
        }
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
    proto.buildArray = function(arr, model, root) {
      root = root || '';
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
          self.buildObj(this, model, root);
          if (model !== undefined) {
            model.trigger('change:' + root);
          }
        };
      });
      self.buildObj(arr, model, root);
    };
    proto.buildObj = function(obj, model, root) {
      root = root || '';
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
        var path = genPath(root, k);
        if (obj[k].constructor === window.Array) {
          self.buildArray(obj[k], model, path);
        }
        if (obj[k].constructor === window.Object) {
          self.buildObj(obj[k], model, path);
        }
        properties[k] = {
          get: function() {
            return this.__c__[k];
          },
          set: function(v) {
            switch(v.constructor) {
              case window.Array:
                self.buildArray(v, model, path);
                break;
              case window.Object:
                self.buildObj(v, model, path);
                break;
            }
            var isNew = (this.__c__[k] !== v);
            this.__c__[k] = v;
            if (model !== undefined && isNew) {
              model.trigger('change:' + path);
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
