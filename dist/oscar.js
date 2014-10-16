(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var undefined;
module.exports = {
  PREFIX: 'oscar-'
};
},{}],2:[function(require,module,exports){
var ViewModel = require('./libs/viewmodel'),
    builder = require('./libs/builder'),
    shims = require('./libs/shims'),
    dom = require('./libs/dom'),
    utils = require('./utils');

// do shim
shims.shim();
(function(window, undefined) {
  window.Oscar = (function() {
    function Oscar(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new TypeError('invalid vm type');
      }
      var $els = dom.querySelectorAll(utils.$DOC, obj.el);
      if (!$els.length) {
        throw new Error('cannot find the element');
      }
      var $el = $els[0],
          vm;
      vm = new ViewModel({
        $el: $el,
        data: obj.data
      });
      builder.buildObj(vm.data);
      vm.render();
      vm.inited = true;
      return vm;
    }
    return Oscar;
  })();
})(utils.WIN);

},{"./libs/builder":3,"./libs/dom":10,"./libs/shims":13,"./libs/viewmodel":14,"./utils":15}],3:[function(require,module,exports){
/**
 * Created by yetone on 14-10-11.
 */
var Observer = require('./observer');
var utils = require('../utils');
var ArrayProxy = Object.create(utils.arrProto);
var ObjectProxy = Object.create(utils.objProto);
var undefined;

utils.forEach(['push', 'pop', 'shift', 'unshift', 'splice'], function(method) {
  var args;
  utils.defProtected(ArrayProxy, method, function() {
    var self = this;
    var oldL = self.length;
    var idx;
    var removed;
    if (self.__idx__ === undefined) {
      self.__idx__ = 0;
    }
    args = utils.toArray(arguments);
    removed = utils.arrProto[method].apply(this, args);
    switch (method) {
      case 'splice':
        if (!removed) break;
        utils.forEach(utils.range(args[0], args[1]), function(v) {
          self.__observer__.trigger('remove:' + v);
          self.__observer__.off('set:' + v);
          self.__observer__.off('change:' + v);
        });
        break;
      case 'pop':
        if (!removed) break;
        self.__observer__.trigger('remove:' + (this.length - 1));
        self.__observer__.off('set:' + (this.length - 1));
        self.__observer__.off('change:' + (this.length - 1));
        break;
      case 'shift':
        if (!removed) break;
        idx = self.__idx__++;
        self.__observer__.trigger('remove:' + idx);
        self.__observer__.off('set:' + idx);
        self.__observer__.off('change:' + idx);
        break;
      case 'unshift':
        if (!removed) break;
        self.__idx__ = 0;
        break;
    }
    buildObj(self, self.__parent__);
    if (oldL !== this.length) {
      self.__observer__.trigger('change:length');
    }
  });
});
utils.defProtected(ObjectProxy, '$watch', function() {
  if (!this.__observer__) {
    return console.warn('no observer!');
  }
  this.__observer__.watch.apply(this.__observer__, arguments);
});
utils.defProtected(ObjectProxy, '$trigger', function() {
  if (!this.__observer__) {
    return console.warn('no observer!');
  }
  this.__observer__.trigger.apply(this.__observer__, arguments);
});

function canBuild(obj) {
  return typeof obj === 'object' && obj && !obj.__observer__;
}

function buildObj(obj, parent) {
  if (!obj.__parent__) {
    obj.__parent__ = parent;
  }
  var properties = {};
  if (!obj.__observer__) {
    obj.__observer__ = undefined; // idea's bug
    var observer = new Observer(obj);
    if (parent && parent.__observer__) {
      observer.__parent__ = parent.__observer__;
    }
    utils.defProtected(obj, '__observer__', observer);
  }
  utils.forEach(obj, function(v, k) {
    if (utils.isStr(k) && ['$', '_'].indexOf(k.charAt(0)) > -1) return;
    if (utils.isFunction(v)) return;
    obj.__observer__.store[k] = v;
    if (canBuild(v)) {
      buildObj(v, obj);
    }
    properties[k] = {
      get: function() {
        return this.__observer__.store[k];
      },
      set: function(value) {
        if (canBuild(value)) {
          buildObj(value, obj);
        }
        var isNew = (this.__observer__.store[k] !== value);
        this.__observer__.store[k] = value;
        if (isNew) {
          this.__observer__.trigger('change:' + k);
        }
      }
    };
    obj.__observer__.trigger('set:' + k);
  });
  utils.defs(obj, properties);
  if (utils.isArray(obj)) {
    obj.__proto__ = ArrayProxy;
  } else {
    obj.__proto__ = ObjectProxy;
  }
}

module.exports = {
  buildObj: buildObj
};

},{"../utils":15,"./observer":12}],4:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var ifDirective = require('./directives/if');
var forDirective = require('./directives/for');
var bindDirective = require('./directives/bind');
var onDirective = require('./directives/on');
var classDirective = require('./directives/class');
var dom = require('./dom');
var utils = require('../utils');
var undefined;

var compile = function(vm, $node, scope) {
  $node = $node || vm.$el;
  scope = scope || vm.data;
  var bind, hasBind, hasClass, hasOn, hasIf, hasFor, attrs;
  if ($node.nodeType === 3) {
    return utils._bind(vm, $node, 'textContent', scope);
  }
  hasBind = dom.hasAttribute($node, vm.prefix + 'bind');
  hasClass = dom.hasAttribute($node, vm.prefix + 'class');
  hasOn = true;
  hasIf = dom.hasAttribute($node, vm.prefix + 'if');
  hasFor = dom.hasAttribute($node, vm.prefix + 'for');
  attrs = utils.toArray($node.attributes);
  attrs = attrs.filter(function(v) {
    return v.name.indexOf(vm.prefix) !== 0;
  });
  if (hasFor && !$node.inited) {
    forDirective.compile(vm, $node, scope);
    return;
  }
  attrs.forEach(function(v) {
    utils._bind(vm, v, 'value', scope);
  });
  if (hasBind) {
    bindDirective.compile(vm, $node, scope);
  }
  if (hasClass) {
    classDirective.compile(vm, $node, scope);
  }
  if (hasOn) {
    onDirective.compile(vm, $node, scope);
  }
  if (hasIf) {
    ifDirective.compile(vm, $node, scope);
  }
  if (dom.contains(utils.$DOC, $node)) {
    utils.toArray($node.childNodes).forEach(function($node) {
      compile(vm, $node);
    });
  }
};

module.exports = {
  compile: compile
};
},{"../utils":15,"./directives/bind":5,"./directives/class":6,"./directives/for":7,"./directives/if":8,"./directives/on":9,"./dom":10}],5:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var bind = utils.getBind($node),
        eventType = utils.getEventType($node),
        multiple = dom.hasAttribute($node, 'multiple'),
        bindValue = $node.getAttribute(vm.prefix + 'bind'),
        path = utils.genPath(bindValue);
    if (!bind) return;
    if (multiple) {
      utils.watch([path], function() {
        var $opts = utils.toArray($node.options);
        $opts.forEach(function($opt) {
          $opt.selected = eval('(scope' + utils.genS(path) + '.indexOf($opt.value) >= 0)');
        });
      }, scope);
      if (eventType) {
        dom.addEventListener($node, eventType, function() {
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
      utils.watch([path], function() {
        if ($node.type === 'radio') {
          $node[bind] = eval('(scope' + utils.genS(path) + ' === $node.value)');
        } else {
          $node[bind] = utils.runWithScope(bindValue, scope);
        }
      }, scope);
      if (eventType) {
        dom.addEventListener($node, eventType, function() {
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

},{"../../utils":15,"../dom":10}],6:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var ocls = $node.getAttribute(vm.prefix + 'class'),
        paths = vm.getPaths('{{' + ocls + '}}', scope);
    utils.watch(paths, function() {
      var classObj = utils.runWithScope('({' + ocls + '})', scope);
      utils.forEach(classObj, function(v, cls) {
        if (v === true) {
          $node.classList.add(cls);
        } else {
          $node.classList.remove(cls);
        }
      });
    }, scope);
  }
};

},{"../../utils":15}],7:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var $tmp = $node,
        $ps = $node.previousSibling,
        $ns = $node.nextSibling,
        $pn = $node.parentNode,
        $cns = $node.childNodes,
        exp = $node.getAttribute(vm.prefix + 'for'),
        expl = /([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*)/.exec(exp),
        obj,
        isArray;
    if (!expl || expl.length !== 3) return;
    obj = eval('(scope' + utils.genS(expl[2]) + ')');
    isArray = utils.isArray(obj);
    function _replace(str, kstr, key) {
      str = utils.replaceEvalStr(str, expl[1], expl[2] + '[\'' + key + '\']');
      str = utils.replaceEvalStr(str, kstr, '\'' + key + '\'');
      return str;
    }
    function _render() {
      var re = /\{\{(.*?)\}\}/g,
          kstr;
      !$node.inited && dom.removeElement($node);
      utils.forEach(obj, function(item, key) {
        if (utils.isStr(key) && ['$', '_'].indexOf(key.charAt(0)) > -1) return;
        if (!utils.hasOwn.call(obj, key)) return;
        if (isArray && isNaN(+key)) return;
        kstr = '$key';
        if (isArray) {
          kstr = '$index';
        }
        $node = item.$el;
        if (!$node) {
          $node = $tmp.cloneNode(true);
          // 起名什么的最讨厌了！
          (function __($node) {
            if ($node.nodeType === 3) {
              $node.textContent = $node.textContent.replace(re, function(_, a) {
                a = _replace(a, kstr, key);
                return '{{' + a + '}}';
              });
              return;
            }
            var oscarAttrs = ['bind', 'on', 'class', 'if'],
                attrs = utils.toArray($node.attributes),
                $cns = utils.toArray($node.childNodes);
            oscarAttrs.forEach(function(_attr) {
              var attr = vm.prefix + _attr,
                a;
              if (dom.hasAttribute($node, attr)) {
                a = $node.getAttribute(attr);
                a = _replace(a, kstr, key);
                $node.setAttribute(attr, a);
              }
            });
            attrs = attrs.filter(function(v) {
              return v.name.indexOf(vm.prefix) !== 0;
            });
            attrs.forEach(function(v) {
              v.value = v.value.replace(re, function(_, a) {
                a = _replace(a, kstr, key);
                return '{{' + a + '}}';
              });
            });
            $cns.forEach(function($n) {
              __($n);
            });
          })($node);
          item.$el = $node;
        }

        if (dom.contains(utils.$DOC, $node)) return;
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
          return v.name.indexOf(vm.prefix) !== 0;
        });
        attrs.forEach(function(v) {
          utils._bind(vm, v, 'value', scope);
        });
        obj.__observer__.on('remove:' + key, (function($node) {
          return function() {
            dom.removeElement($node);
          }
        })($node));
        $node.inited = true;
        vm.render($node);
      });
    }
    obj.__observer__.watch('length', function() {
      _render();
    });
  }
};

},{"../../utils":15,"../dom":10}],8:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var exp = utils.parseExp($node.getAttribute(vm.prefix + 'if')),
        $tmp = $node,
        $ps = $node.previousSibling,
        $ns = $node.nextSibling,
        $pn = $node.parentNode,
        removed = false,
        paths = vm.getPaths('{{' + exp + '}}', scope);
    utils.watch(paths, cbk, scope);
    function cbk() {
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
        vm.render($node0, null, true);
        $node = $node0;
        $tmp = $node;
        removed = false;
      } else {
        dom.removeElement($node);
        removed = true;
      }
    }
  }
};

},{"../../utils":15,"../dom":10}],9:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var attrs = utils.toArray($node.attributes);
    utils.forEach(attrs, function(v) {
      if (v.name.indexOf(vm.prefix + 'on-') !== 0) return;
      var eventName = new RegExp(vm.prefix + 'on-' + '(.*)').exec(v.name)[1];
      var cbkStr = v.value;
      if (eventName) {
        dom.addEventListener($node, eventName, function (e) {
          utils.runWithEvent(cbkStr, scope, this, e);
        });
      }
    });
    var str = $node.getAttribute(vm.prefix + 'on');
    if (str) {
      var onObj = utils.runWithScope('{' + str + '}', scope);
      utils.forEach(onObj, function(cbk, evt) {
        dom.addEventListener($node, evt, cbk);
      });
    }
  }
};

},{"../../utils":15,"../dom":10}],10:[function(require,module,exports){
/**
 * Created by yetone on 14-10-13.
 */
// DOM 操作不使用 shim 是因为某些渣渣浏览器无法访问到 Event 和 Element 对象
function addEventListener($el, type, listener) {
  function wrapper(e) {
    e.target = e.srcElement;
    e.currentTarget = $el;
    if (listener.handleEvent) {
      listener.handleEvent(e);
    } else {
      listener.call($el, e);
    }
  }
  if ($el.addEventListener) {
    return $el.addEventListener(type, listener, false);
  }
  if ($el.attachEvent) {
    return $el.attachEvent('on' + type, wrapper);
  }
  return $el['on' + type] = function() {
    wrapper(window.event);
  };
}
function removeEventListener($el, type, listener) {
  if ($el.removeEventListener) {
    return $el.removeEventListener(type, listener);
  }
  if ($el.detachEvent) {
    return $el.detachEvent('on' + type, listener);
  }
  return $el['on' + type] = null;
}
function removeElement($el) {
  if ($el.remove) {
    return $el.remove();
  }
  if ($el.parentNode) {
    return $el.parentNode.removeChild($el);
  }
}
function querySelectorAll($el, selector) {
  if ($el.querySelectorAll) {
    return $el.querySelectorAll(selector);
  }
  // TODO
  return [$el.getElementById(selector.slice(1))];
}
function hasAttribute($el, attr) {
  if ($el.hasAttribute) {
    return $el.hasAttribute(attr);
  }
  return $el[attr] !== undefined;
}
function fixContains(a, b) {
  if (b) {
    while ((b = b.parentNode)) {
      if (b === a) {
        return true;
      }
    }
  }
  return false;
}
function contains($el, $el0) {
  if (typeof $el.contains === 'function') {
    return $el.contains($el0);
  }
  return fixContains($el, $el0)
}
function underAttribute($node, attr) {
  if ($node.parentElement && hasAttribute($node.parentElement, attr)) return true;
  if ($node.tagName === 'BODY') {
    return hasAttribute($node, attr);
  } else {
    return underAttribute($node.parentNode, attr);
  }
}

module.exports = {
  addEventListener: addEventListener,
  removeEventListener: removeEventListener,
  removeElement: removeElement,
  querySelectorAll: querySelectorAll,
  hasAttribute: hasAttribute,
  contains: contains,
  underAttribute: underAttribute
};

},{}],11:[function(require,module,exports){
/**
 * Created by yetone on 14-10-13.
 */

function getIEDefineProperties() {
  //IE6-8使用VBScript类的set get语句实现. from 司徒正美
  window.execScript([
    "Function parseVB(code)",
    "\tExecuteGlobal(code)",
    "End Function",
    "Dim VBClassBodies",
    "Set VBClassBodies=CreateObject(\"Scripting.Dictionary\")",
    "Function findOrDefineVBClass(name,body)",
    "\tDim found",
    "\tfound=\"\"",
    "\tFor Each key in VBClassBodies",
    "\t\tIf body=VBClassBodies.Item(key) Then",
    "\t\t\tfound=key",
    "\t\t\tExit For",
    "\t\tEnd If",
    "\tnext",
    "\tIf found=\"\" Then",
    "\t\tparseVB(\"Class \" + name + body)",
    "\t\tVBClassBodies.Add name, body",
    "\t\tfound=name",
    "\tEnd If",
    "\tfindOrDefineVBClass=found",
    "End Function"
  ].join("\n"), "VBScript");

  function VBMediator(accessingProperties, name, value) {
    var accessor = accessingProperties[name];
    if (typeof accessor === "function") {
      if (arguments.length === 3) {
        accessor(value)
      } else {
        return accessor()
      }
    }
  }
  return function(name, accessors, properties) {
    var className = "VBClass" + setTimeout("1"),
      buffer = [];
    buffer.push(
      "\r\n\tPrivate [__data__], [__proxy__]",
      "\tPublic Default Function [__const__](d, p)",
      "\t\tSet [__data__] = d: set [__proxy__] = p",
      "\t\tSet [__const__] = Me", //链式调用
      "\tEnd Function");
    //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
    for (name in properties) {
      if (!accessors.hasOwnProperty(name)) {
        buffer.push("\tPublic [" + name + "]");
      }
    }
    buffer.push("\tPublic [" + 'hasOwnProperty' + "]");
    //添加访问器属性
    for (name in accessors) {
      buffer.push(
        //由于不知对方会传入什么,因此set, let都用上
          "\tPublic Property Let [" + name + "](val" + expose + ")", //setter
          "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
        "\tEnd Property",
          "\tPublic Property Set [" + name + "](val" + expose + ")", //setter
          "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
        "\tEnd Property",
          "\tPublic Property Get [" + name + "]", //getter
        "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
          "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
        "\tIf Err.Number <> 0 Then",
          "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
        "\tEnd If",
        "\tOn Error Goto 0",
        "\tEnd Property");

    }

    buffer.push("End Class");
    var code = buffer.join("\r\n"),
      realClassName = window['findOrDefineVBClass'](className, code); //如果该VB类已定义，返回类名。否则用className创建一个新类。
    if (realClassName === className) {
      window.parseVB([
          "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
        "\tDim o",
          "\tSet o = (New " + className + ")(a, b)",
          "\tSet " + className + "Factory = o",
        "End Function"
      ].join("\r\n"))
    }
    var ret = window[realClassName + "Factory"](accessors, VBMediator); //得到其产品
    return ret; //得到其产品
  }
}

module.exports = {
  getIEDefineProperties: getIEDefineProperties
};

},{}],12:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../utils');
var undefined;

var Observer = (function() {
  function Observer(ctx) {
    this._ctx = ctx || this;
    this._cbks = {};
    this.store = {};
  }
  var proto = Observer.prototype;
  proto.on = function(eventName, cbk) {
    if (!utils.isFunction(cbk)) {
      throw new TypeError('eventHandler must be a function');
    }
    var self = this;
    if (!(eventName in self._cbks)) {
      self._cbks[eventName] = [];
    }
    self._cbks[eventName].push(cbk);
    return self;
  };
  proto.off = function(eventName, fun) {
    var self = this;
    if (!(eventName in self._cbks)) {
      return self;
    }
    if (!fun) {
      self._cbks[eventName] = [];
      return self;
    }
    self._cbks[eventName] = self._cbks[eventName].filter(function(item) {
      return item !== fun;
    });
    return self;
  };
  proto.trigger = function(e) {
    var self = this,
        handlerArgs = utils.arrProto.slice(arguments, 1);
    if (e in self._cbks) {
      utils.forEach(self._cbks[e], function(cbk) {
        cbk && cbk.apply(self._ctx, handlerArgs);
      });
    }
    if (self.__parent__) {
      return self.__parent__.trigger('change:*');
    }
    return self;
  };
  proto.watch = function(el, cbk) {
    var self = this;
    if (utils.isStr(el)) {
      el = el.split(' ');
    }
    utils.forEach(el, function(e) {
      self.on('set:' + e, cbk);
      self.on('change:' + e, cbk);
    });
    cbk();
  };
  return Observer;
})();

module.exports = Observer;

},{"../utils":15}],13:[function(require,module,exports){
/**
 * Created by yetone on 14-10-11.
 */
var utils = require('../utils');
var expose = new Date - 0;
var undefined;

function shim() {
  if (!utils.arrProto.indexOf) {
    utils.arrProto.indexOf = function(searchElement, fromIndex) {
      var k;
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var O = Object(this);
      var len = O.length >>> 0;
      if (len === 0) {
        return -1;
      }

      var n = +fromIndex || 0;
      if (Math.abs(n) === Infinity) {
        n = 0;
      }
      if (n >= len) {
        return -1;
      }

      k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      while (k < len) {
        if (k in O && O[k] === searchElement) {
          return k;
        }
        k++;
      }
      return -1;
    };
  }
  if (!utils.arrProto.forEach) {
    utils.arrProto.forEach = function(cbk) {
      for (var i = 0, l = this.length; i < l; i++) {
        cbk.call(cbk, this[i], i);
      }
    };
  }
  if (!utils.arrProto.filter) {
    utils.arrProto.filter = function(fun/*, thisArg*/) {

      if (this === void 0 || this === null) {
        throw new TypeError();
      }

      var t = Object(this);
      var len = t.length >>> 0;
      if (typeof fun !== 'function') {
        throw new TypeError();
      }

      var res = [];
      var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
      for (var i = 0; i < len; i++) {
        if (i in t) {
          var val = t[i];

          if (fun.call(thisArg, val, i, t)) {
            res.push(val);
          }
        }
      }

      return res;
    };
  }
}

module.exports = {
  shim: shim
};

},{"../utils":15}],14:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var config = require('../config');
var compiler = require('./compiler');
var utils = require('../utils');
var undefined;

var ViewModel = (function() {
  function ViewModel(obj) {
    this.$el = obj.$el;
    this.data = obj.data;
    this.inited = obj.inited || false;
    this.prefix = obj.prefix || config.PREFIX;
  }
  var proto = ViewModel.prototype;
  proto.getPaths = function(txt, scope) {
    scope = scope || this.data;
    var m = txt.match(/\{\{.*?\}\}/g),
        bvs = [],
        pl;
    if (!m) return bvs;
    m.forEach(function(str) {
      str = str.substr(2, str.length - 4).trim();
      pl = utils.parseEvalStr(str).strL;
      bvs.extend(pl);
    });
    bvs = bvs.filter(function(v) {
      try {
        return eval('(scope' + utils.genS(v) + ' !== undefined)');
      } catch(e) {
        return false;
      }
    });
    return bvs;
  };
  proto.render = function($node, scope) {
    compiler.compile(this, $node, scope);
  };
  return ViewModel;
})();

module.exports = ViewModel;

},{"../config":1,"../utils":15,"./compiler":4}],15:[function(require,module,exports){
if (typeof window === 'undefined') {
  window = getWindow();
}
var arrProto = window.Array.prototype,
    strProto = window.String.prototype,
    objProto = window.Object.prototype,
    hasOwn = {}.hasOwnProperty,
    def = window.Object.defineProperty,
    defs = window.Object.defineProperties,
    getObjKeys = window.Object.keys,
    isArray = window.Array.isArray,
    isIE = !-[1,],
    helpers = require('./libs/helpers'),
    $DOC = window.document || {},
    undefined;
// 补丁，为了某些浏览器
(function() {
  try {
    def({}, 'test', {
      value: 'test'
    });
  } catch(e) {
    if ('__defineGetter__' in objProto) {
      def = function(obj, prop, desc) {
        if ('value' in desc) {
          obj[prop] = desc.value;
        }
        if ('get' in desc) {
          objProto.__defineGetter__.call(obj, prop, desc.get);
        }
        if ('set' in desc) {
          objProto.__defineSetter__.call(obj, prop, desc.set);
        }
        return obj;
      };
      defs = function(obj, properties) {
        var name;
        for (name in properties) {
          if (hasOwn.call(properties, name)) {
            def(obj, name, properties[name]);
          }
        }
        return obj;
      };
    // IE6-8 使用 VBScript 类的 set get 语句实现. from 司徒正美
    } else if (window.VBArray) {
      defs = helpers.getIEDefineProperties();
    }
  }

  if (!isArray) {
    isArray = function(obj) {
      return getType(obj) === 'Array';
    };
  }

  if (!getObjKeys) {
    getObjKeys = (function() {
      var hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
          dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
          ],
          dontEnumsLength = dontEnums.length;

      return function(obj) {
        if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }

        var result = [], prop, i;

        for (prop in obj) {
          if (hasOwn.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwn.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }
})();

// 扩展
if (!isFunction(arrProto.has)) {
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
  arrProto.extend = function(a) {
    arrProto.push.apply(this, a);
    return this;
  };
  strProto.splice = function(start, length, replacement) {
    replacement = replacement || '';
    return this.substr(0, start) + replacement + this.substr(start + length);
  };
  strProto.startsWith = function(str) {
    return this.indexOf(str) === 0;
  };
  strProto.endsWith = function(str) {
    return this.lastIndexOf(str) === this.length - str.length;
  };
  objProto.extend = function(obj) {
    for (var k in obj) {
      this[k] = obj[k];
    }
  };
}

function getType(obj) {
  return objProto.toString.call(obj).slice(8, -1);
}
function isObj(obj) {
  return getType(obj) === 'Object';
}
function isFunction(obj) {
  return getType(obj) === 'Function';
}
function isStr(obj) {
  return getType(obj) === 'String';
}
function toArray(obj) {
  try {
    return arrProto.slice.call(obj);
  } catch(e) {
    // 万恶的 IE
    var arr = [],
        name;
    for (name in obj) {
      if (!hasOwn.call(obj, name)) continue;
      if (!isNaN(+name)) continue;
      arr[+name] = obj[name];
    }
    return arr;
  }
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
    if (hasOwn.call(parent, k)) child[k] = parent[k];
  }
  fix.prototype = parent.prototype;
  child.prototype = new fix();
  child.__super__ = parent.prototype;
  return child;
}
function getWindow() {
  return (new Function('return this;'))();
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
          acc = [];
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
        if (!/[\.\[\]'"]/.test(c)) {
          str = acc.join('.');
          if (str) {
            strL.push(str);
            acc = [];
          }
        }
      }
    } else {
      if (bi !== undefined) {
        ei = i;
        substr = txt.substr(bi, ei - bi);
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
  obj.strL = strL;
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
function forEach(obj, cbk) {
  if (isFunction(obj.forEach)) {
    return obj.forEach(cbk);
  }
  for (var k in obj) {
    if (!hasOwn.call(obj, k)) continue;
    cbk(obj[k], k);
  }
}
function splitPath(paths) {
  var obj = {};
  forEach(paths, function(v) {
    var idx = v.lastIndexOf('.');
    if (idx < 0) {
      if (!obj['*']) {
        obj['*'] = [];
      }
      return obj['*'].push(v);
    }
    var key = v.slice(0, idx);
    var value = v.slice(idx + 1);
    if (!obj[key]) {
      obj[key] = [];
    }
    obj[key].push(value);
  });
  return obj;
}
function watch(paths, cbk, scope) {
  // scope 很重要
  forEach(splitPath(paths), function(v, k) {
    try {
      if (k === '*') {
        scope.__observer__.watch(v, cbk);
      } else {
        eval('(scope' + genS(k) + ')').__observer__.watch(v, cbk);
      }
    } catch(e) {
      console.log(e);
    }
  });
}
function _bind(vm, obj, attr, scope) {
  var paths = vm.getPaths(obj[attr], scope),
      es = getEvalString(obj[attr]);
  if (!es) return;
  watch(paths, function() {
    try {
      obj[attr] = runWithScope(es, scope);
    } catch(e) {
      console.log(e);
    }
  }, scope);
}
function defProtected(obj, key, value, enumerable, writable) {
  def(obj, key, {
    value: value,
    enumerable: enumerable,
    writable: writable,
    configurable: true
  })
}

module.exports = {
  arrProto: arrProto,
  strProto: strProto,
  objProto: objProto,
  hasOwn: hasOwn,
  forEach: forEach,
  def: def,
  defs: defs,
  getObjKeys: getObjKeys,

  getType: getType,
  isObj: isObj,
  isArray: isArray,
  isFunction: isFunction,
  isStr: isStr,

  toArray: toArray,
  range: range,

  getEvalString: getEvalString,
  parseEvalStr: parseEvalStr,
  replaceEvalStr: replaceEvalStr,
  parseExp: parseExp,
  genPath: genPath,
  genS: genS,
  getBind: getBind,
  getEventType: getEventType,
  splitPath: splitPath,
  watch: watch,

  defProtected: defProtected,

  runWithScope: runWithScope,
  runWithEvent: runWithEvent,

  _bind: _bind,
  _extends: _extends,
  getWindow: getWindow,

  isIE: isIE,

  WIN: window,
  $DOC: $DOC
};

},{"./libs/helpers":11}]},{},[2])