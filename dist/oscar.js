(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var undefined;
module.exports = {
  PREFIX: 'oscar-'
};
},{}],2:[function(require,module,exports){
var Model = require('./libs/model').Model,
    Store = require('./libs/store').Store,
    utils = require('./utils'),
    undefined;

(function(window, undefined) {
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
          args = utils.toArray(arguments);
          // clone arguments
          var _args = utils.toArray(arguments);
          if (method === 'splice') {
            var subArgs = args.slice(2);
            self.buildObj([subArgs], model);
            args = args.slice(0, 2);
            utils.arrProto.push.apply(args, subArgs);
          } else {
            self.buildObj(args, model);
          }
          utils.arrProto[method].apply(this, args);
          this.__c__.apply(method, _args);
          self.buildObj(this, model, root);
          if (model !== undefined) {
            model.trigger('change:' + root);
            model.trigger('change:*');
            if (oldL !== this.length) {
              model.trigger('change:' + utils.genPath(root, '__index__'));
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
      utils.getObjKeys(obj).forEach(function(k) {
        if (k === '__c__') return;
        if (typeof obj[k] === 'function') return;
        obj.__c__.set(k, obj[k]);
        var path = utils.genPath(root, k);
        if (utils.isArray(obj[k])) {
          self.buildArray(obj[k], model, path);
        }
        if (utils.isObj(obj[k])) {
          self.buildObj(obj[k], model, path);
        }
        properties[k] = {
          get: function() {
            return this.__c__.get(k);
          },
          set: function(v) {
            if (utils.isArray(v)) {
              self.buildArray(v, model, path);
            }
            if (utils.isObj(v)) {
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
      utils.defs(obj, properties);
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

},{"./libs/model":9,"./libs/store":11,"./utils":12}],3:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var ifDirective = require('./directives/if');
var forDirective = require('./directives/for');
var bindDirective = require('./directives/bind');
var actionDirective = require('./directives/action');
var classDirective = require('./directives/class');
var utils = require('../utils');
var DOC = utils.DOC;
var undefined;

var compile = function(model, $node, scope) {
  $node = $node || model.$el;
  scope = scope || model.data;
  var bind, hasBind, hasClass, hasAction, hasIf, hasFor, bindValues, attrs;
  if ($node.nodeType === 3) {
    return utils._bind(model, $node, 'textContent', scope);
  }
  hasBind = $node.hasAttribute(model.prefix + 'bind');
  hasClass = $node.hasAttribute(model.prefix + 'class');
  hasAction = $node.hasAttribute(model.prefix + 'action');
  hasIf = $node.hasAttribute(model.prefix + 'if');
  hasFor = $node.hasAttribute(model.prefix + 'for');
  attrs = utils.toArray($node.attributes);
  attrs = attrs.filter(function(v) {
    return v.name.indexOf(model.prefix) !== 0;
  });
  attrs.forEach(function(v) {
    utils._bind(model, v, 'value', scope);
  });
  if (hasFor && !$node.inited) {
    forDirective.compile(model, $node, scope);
    return;
  }
  if (hasBind) {
    bindDirective.compile(model, $node, scope);
  }
  if (hasClass) {
    classDirective.compile(model, $node, scope);
  }
  if (hasAction) {
    actionDirective.compile(model, $node, scope);
  }
  if (hasIf) {
    ifDirective.compile(model, $node, scope);
  }
  if (DOC.contains($node)) {
    utils.toArray($node.childNodes).forEach(function($node) {
      compile(model, $node);
    });
  }
};

module.exports = {
  compile: compile
};
},{"../utils":12,"./directives/action":4,"./directives/bind":5,"./directives/class":6,"./directives/for":7,"./directives/if":8}],4:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var oact = $node.getAttribute(model.prefix + 'action'),
        acl = /(\w+):(.*)/g.exec(oact);
    if (acl.length === 3) {
      $node.addEventListener(acl[1], function(e) {
        utils.runWithEvent(acl[2], scope, this, e);
      });
    }
  }
};

},{"../../utils":12}],5:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var bind = utils.getBind($node),
        eventType = utils.getEventType($node),
        multiple = $node.hasAttribute('multiple'),
        bindValue = $node.getAttribute(model.prefix + 'bind'),
        path = utils.genPath(bindValue);
    if (!bind) return;
    if (multiple) {
      model.watch(path, function() {
        var $opts = utils.toArray($node.options);
        $opts.forEach(function($opt) {
          $opt.selected = eval('(scope' + utils.genS(path) + '.indexOf($opt.value) >= 0)');
        });
      });
      if (eventType) {
        $node.addEventListener(eventType, function() {
          var $selectedOpts = utils.toArray($node.selectedOptions),
            acc = [],
            es;
          $selectedOpts.forEach(function($opt) {
            if ($opt.selected) {
              acc.push($opt.value);
            }
          });
          es = '(scope' + utils.genS(path) + ' = acc)';
          eval(es);
        });
      }
    } else {
      model.watch(path, function() {
        if ($node.type === 'radio') {
          $node[bind] = eval('(scope' + utils.genS(path) + ' === $node.value)');
        } else {
          $node[bind] = utils.runWithScope(bindValue, scope);
        }
      });
      if (path !== path.split('.')[0]) {
        model.watch(path.split('.')[0], function() {
          $node[bind] = utils.runWithScope(bindValue, scope);
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
};

},{"../../utils":12}],6:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var ocls = $node.getAttribute(model.prefix + 'class'),
        bindValues = model.getBindValues('{{' + ocls + '}}', scope);
    model.watch(bindValues, function() {
      var classObj = utils.runWithScope('(' + ocls + ')', scope);
      utils.getObjKeys(classObj).forEach(function(cls) {
        if (classObj[cls] === true) {
          $node.classList.add(cls);
        } else {
          $node.classList.remove(cls);
        }
      });
    });
  }
};

},{"../../utils":12}],7:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var $tmp = $node,
        $ps = $node.previousSibling,
        $ns = $node.nextSibling,
        $pn = $node.parentNode,
        $cns = $node.childNodes,
        exp = $node.getAttribute(model.prefix + 'for'),
        expl = /([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(exp),
        acc = [];
    if (!expl && expl.length !== 3) return;
    function render() {
      var dv = eval('(scope' + utils.genS(expl[2]) + ')'),
        obj = dv;
      if (utils.isObj(dv)) {
        obj = utils.getObjKeys(dv);
      }
      $node.remove();
      obj.forEach(function(v, k) {
        if (utils.isObj(dv) && v === '__c__') return;
        var $node,
          re = /\{\{(.*?)\}\}/g,
          idx = k,
          kstr = '$index';
        if (utils.isObj(dv)) {
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
                a = utils.replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                a = utils.replaceEvalStr(a, kstr, '\'' + idx + '\'');
                return '{{' + a + '}}';
              });
              return;
            }
            var oscarAttrs = ['bind', 'action', 'class', 'if'],
              attrs = utils.toArray($node.attributes),
              $cns = utils.toArray($node.childNodes);
            oscarAttrs.forEach(function(_attr) {
              var attr = model.prefix + _attr,
                a;
              if ($node.hasAttribute(attr)) {
                a = $node.getAttribute(attr);
                a = utils.replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                a = utils.replaceEvalStr(a, kstr, '\'' + idx + '\'');
                $node.setAttribute(attr, a);
              }
            });
            attrs = attrs.filter(function(v) {
              return v.name.indexOf(model.prefix) !== 0;
            });
            attrs.forEach(function(v) {
              v.value = v.value.replace(re, function(_, a) {
                a = utils.replaceEvalStr(a, expl[1], expl[2] + '[\'' + idx + '\']');
                a = utils.replaceEvalStr(a, kstr, '\'' + idx + '\'');
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
        var attrs = utils.toArray($node.attributes).filter(function(v) {
          return v.name.indexOf(model.prefix) !== 0;
        });
        attrs.forEach(function(v) {
          utils._bind(model, v, 'value', scope);
        });
        model.watch(bindValues, function() {
          var dv = eval('(scope' + utils.genS(expl[2]) + ')'),
            hasMe;
          if (utils.isObj(dv)) {
            hasMe = v in dv;
          } else {
            hasMe = k in dv;
          }
          if (!hasMe) {
            $node.remove();
          }
        });
        $node.inited = true;
        model.render($node);
      });
    }
    var bindValues = model.getBindValues('{{' + expl[2] + '}}', scope);
    model.watch(bindValues, function() {
      render();
    });
  }
};

},{"../../utils":12}],8:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var exp = utils.parseExp($node.getAttribute(model.prefix + 'if')),
      $tmp = $node,
      $ps = $node.previousSibling,
      $ns = $node.nextSibling,
      $pn = $node.parentNode,
      removed = false,
      bindValues = model.getBindValues('{{' + exp + '}}', scope);
    model.watch(bindValues, function() {
      if (utils.runWithScope(exp, scope)) {
        if (!removed) return;
        var $node0 = $tmp;
        if ($ps && $ps.nextSibling) {
          $pn.insertBefore($node0, $ps.nextSibling);
        } else if ($ns) {
          $pn.insertBefore($node0, $ns);
        } else if ($pn) {
          $pn.appendChild($node0);
        }
        model.render($node0, null, true);
        $node = $node0;
        $tmp = $node;
        removed = false;
      } else {
        $node.remove();
        removed = true;
      }
    });
  }
};

},{"../../utils":12}],9:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var config = require('../config');
var observer = require('./observer');
var compiler = require('./compiler');
var utils = require('../utils');
var undefined;

var Model = (function(_super) {
  utils._extends(Model, _super);
  function Model(obj) {
    this.$el = obj.$el;
    this.tpl = obj.tpl;
    this.data = obj.data;
    this.inited = obj.inited || false;
    this.prefix = obj.prefix || config.PREFIX;

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
      pl = utils.parseEvalStr(str).strL;
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
    compiler.compile(this, $node, scope);
  };
  return Model;
})(observer.Observer);

module.exports = {
  Model: Model
};

},{"../config":1,"../utils":12,"./compiler":3,"./observer":10}],10:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../utils');
var undefined;

var Observer = (function() {
  function Observer() {
    this.eventHandlerObj = {};
  }
  var proto = Observer.prototype;
  proto.on = function(eventType, cbk) {
    if (!utils.isFunction(cbk)) {
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
      handlerArgs = utils.arrProto.slice(arguments, 1);
    if (e in self.eventHandlerObj) {
      self.eventHandlerObj[e].forEach(function(cbk) {
        cbk && cbk.apply(self, handlerArgs);
      });
    }
    return self;
  };
  proto.watch = function(el, cbk) {
    var self = this;
    if (utils.isStr(el)) {
      el = el.split(' ');
    }
    utils.forEach.call(el, function(e) {
      self.on('set:' + e, cbk);
      self.on('change:' + e, cbk);
      self.on('change:' + utils.genPath(e, '__index__'), cbk);
    });
    cbk();
  };
  return Observer;
})();

module.exports = {
  Observer: Observer
};

},{"../utils":12}],11:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../utils');
var undefined;

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
      if (!utils.hasProp.call(self.__c__, k)) continue;
      if (!self.__c__[k] || self.__c__[k].removed) continue;
      obj[k] = self.__c__[k].value;
    }
    return obj;
  };
  proto.toArray = function() {
    var self = this,
      obj = self.toObj();
    return utils.toArray(obj);
  };
  proto.fixIndex = function() {
    var self = this,
      i = 0;
    utils.forEach.call(self.toArray(), function(v, k) {
      self.setIndex(k, i++);
    });
  };
  proto.apply = function() {
    return '大杀器';
  };
  return Store;
})();

module.exports = {
  Store: Store
};

},{"../utils":12}],12:[function(require,module,exports){
// for mocha
try {
  window;
} catch(e) {
  window = getWindow();
  if (!window.Event) {
    window.Event = function() {};
    window.Element = function() {};
  }
}
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
    isArray = window.Array.isArray,
    undefined;
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
  var _str = acc.join('.');
  if (_str) {
    strL.push(_str);
  }
  obj['strL'] = strL;
  return obj;
}
function replaceEvalStr(txt, searchstr, newstr) {
  var map = parseEvalStr(txt),
    keys = getObjKeys(map),
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
function _bind(model, obj, attr, scope) {
  var bindValues = model.getBindValues(obj[attr], scope),
      es = getEvalString(obj[attr]);
  if (es) {
    model.watch(bindValues, function() {
      try {
        obj[attr] = runWithScope(es, scope);
      } catch(e) {
        console.log(e);
      }
    });
  }
}

var WIN = getWindow();

module.exports = {
  arrProto: arrProto,
  strProto: strProto,
  objProto: objProto,
  eventProto: eventProto,
  elProto: elProto,
  hasProp: hasProp,
  forEach: forEach,
  def: def,
  defs: defs,
  getObjKeys: getObjKeys,

  isObj: isObj,
  isArray: isArray,
  isFunction: isFunction,
  isStr: isStr,
  toArray: toArray,
  getEvalString: getEvalString,
  parseEvalStr: parseEvalStr,
  replaceEvalStr: replaceEvalStr,
  parseExp: parseExp,
  genPath: genPath,
  genS: genS,
  getBind: getBind,
  getEventType: getEventType,
  _extends: _extends,
  runWithScope: runWithScope,
  runWithEvent: runWithEvent,
  getWindow: getWindow,
  _bind: _bind,
  WIN: WIN,
  DOC: WIN.document
};

},{}]},{},[2])