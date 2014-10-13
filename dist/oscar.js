(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var undefined;
module.exports = {
  PREFIX: 'oscar-'
};
},{}],2:[function(require,module,exports){
var Model = require('./libs/model'),
    builder = require('./libs/builder'),
    shims = require('./libs/shims'),
    dom = require('./libs/dom'),
    utils = require('./utils');

// do shim
shims.shim();
(function(window, undefined) {
  window.Oscar = (function() {
    function Oscar() {
      this.modelList = [];
      this.__init__();
    }
    var proto = Oscar.prototype;
    proto.__init__ = function() {
    };
    proto.modelRegister = function(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new TypeError('invalid model type');
      }
      var $els = dom.querySelectorAll(utils.$DOC, obj.el);
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
      builder.buildObj(model.data, model);
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
})(utils.WIN);

},{"./libs/builder":3,"./libs/dom":10,"./libs/model":12,"./libs/shims":14,"./utils":16}],3:[function(require,module,exports){
/**
 * Created by yetone on 14-10-11.
 */
var Store = require('./store');
var utils = require('../utils');
var undefined;

function buildArray(arr, model, root) {
  root = root || '';
  var args;
  ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(function(method) {
    arr[method] = function() {
      var oldL = this.length;
      args = utils.toArray(arguments);
      // clone arguments
      var _args = utils.toArray(arguments);
      if (method === 'splice') {
        var subArgs = args.slice(2);
        buildObj([subArgs], model);
        args = args.slice(0, 2);
        utils.arrProto.push.apply(args, subArgs);
      } else {
        buildObj(args, model);
      }
      utils.arrProto[method].apply(this, args);
      this.__c__.apply(method, _args);
      buildObj(this, model, root);
      if (model !== undefined) {
        model.trigger('change:' + root);
        model.trigger('change:*');
        if (oldL !== this.length) {
          model.trigger('change:' + utils.genPath(root, '__index__'));
        }
      }
    };
  });
  buildObj(arr, model, root);
}

function buildObj(obj, model, root) {
  root = root || '';
  var properties = {};
  if (obj.__c__ === undefined || obj.__c__.constructor !== Store) {
    obj.__c__ = new Store();
  }
  utils.getObjKeys(obj).forEach(function(k) {
    if (k === '__c__') return;
    if (typeof obj[k] === 'function') return;
    obj.__c__.set(k, obj[k]);
    var path = utils.genPath(root, k);
    if (utils.isArray(obj[k])) {
      buildArray(obj[k], model, path);
    }
    if (utils.isObj(obj[k])) {
      buildObj(obj[k], model, path);
    }
    properties[k] = {
      get: function() {
        return this.__c__.get(k);
      },
      set: function(v) {
        if (utils.isArray(v)) {
          buildArray(v, model, path);
        }
        if (utils.isObj(v)) {
          buildObj(v, model, path);
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
}

module.exports = {
  buildObj: buildObj
};

},{"../utils":16,"./store":15}],4:[function(require,module,exports){
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

var compile = function(model, $node, scope) {
  $node = $node || model.$el;
  scope = scope || model.data;
  var bind, hasBind, hasClass, hasOn, hasIf, hasFor, attrs;
  if ($node.nodeType === 3) {
    return utils._bind(model, $node, 'textContent', scope);
  }
  hasBind = dom.hasAttribute($node, model.prefix + 'bind');
  hasClass = dom.hasAttribute($node, model.prefix + 'class');
  hasOn = dom.hasAttribute($node, model.prefix + 'on');
  hasIf = dom.hasAttribute($node, model.prefix + 'if');
  hasFor = dom.hasAttribute($node, model.prefix + 'for');
  attrs = utils.toArray($node.attributes);
  attrs = attrs.filter(function(v) {
    return v.name.indexOf(model.prefix) !== 0;
  });
  if (hasFor && !$node.inited) {
    forDirective.compile(model, $node, scope);
    return;
  }
  attrs.forEach(function(v) {
    utils._bind(model, v, 'value', scope);
  });
  if (hasBind) {
    bindDirective.compile(model, $node, scope);
  }
  if (hasClass) {
    classDirective.compile(model, $node, scope);
  }
  if (hasOn) {
    onDirective.compile(model, $node, scope);
  }
  if (hasIf) {
    ifDirective.compile(model, $node, scope);
  }
  if (dom.contains(utils.$DOC, $node)) {
    utils.toArray($node.childNodes).forEach(function($node) {
      compile(model, $node);
    });
  }
};

module.exports = {
  compile: compile
};
},{"../utils":16,"./directives/bind":5,"./directives/class":6,"./directives/for":7,"./directives/if":8,"./directives/on":9,"./dom":10}],5:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var bind = utils.getBind($node),
        eventType = utils.getEventType($node),
        multiple = dom.hasAttribute($node, 'multiple'),
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

},{"../../utils":16,"../dom":10}],6:[function(require,module,exports){
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

},{"../../utils":16}],7:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
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
        acc = [],
        bindValues;
    if (!expl || expl.length !== 3) return;
    bindValues = model.getBindValues('{{' + expl[2] + '}}', scope);
    function render() {
      var dv = eval('(scope' + utils.genS(expl[2]) + ')'),
        obj = dv;
      if (utils.isObj(dv)) {
        obj = utils.getObjKeys(dv);
      }
      dom.removeElement($node);
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
            var oscarAttrs = ['bind', 'on', 'class', 'if'],
                attrs = utils.toArray($node.attributes),
                $cns = utils.toArray($node.childNodes);
            oscarAttrs.forEach(function(_attr) {
              var attr = model.prefix + _attr,
                a;
              if (dom.hasAttribute($node, attr)) {
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
            dom.removeElement($node);
          }
        });
        $node.inited = true;
        model.render($node);
      });
    }
    model.watch(bindValues, function() {
      render();
    });
  }
};

},{"../../utils":16,"../dom":10}],8:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
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
        dom.removeElement($node);
        removed = true;
      }
    });
  }
};

},{"../../utils":16,"../dom":10}],9:[function(require,module,exports){
/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var oact = $node.getAttribute(model.prefix + 'on'),
        acl = /(\w+):(.*)/g.exec(oact);
    if (acl.length === 3) {
      dom.addEventListener($node, acl[1], function(e) {
        utils.runWithEvent(acl[2], scope, this, e);
      });
    }
  }
};

},{"../../utils":16,"../dom":10}],10:[function(require,module,exports){
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
    return $el.addEventListener(type, listener);
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
var config = require('../config');
var Observer = require('./observer');
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
      pl.forEach(function(v) {
        bvs.add(v);
        var lst = v.split('.');
        for (var i = 1; i < lst.length; i++) {
          bvs.add(lst.slice(0, -i).join('.'));
        }
      });
    });
    return bvs;
  };
  proto.render = function($node, scope) {
    compiler.compile(this, $node, scope);
  };
  return Model;
})(Observer);

module.exports = Model;

},{"../config":1,"../utils":16,"./compiler":4,"./observer":13}],13:[function(require,module,exports){
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
      throw new TypeError('eventHandler must be a function');
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

module.exports = Observer;

},{"../utils":16}],14:[function(require,module,exports){
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

},{"../utils":16}],15:[function(require,module,exports){
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
  proto.remove = function(k) {
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

module.exports = Store;

},{"../utils":16}],16:[function(require,module,exports){
if (typeof window === 'undefined') {
  window = getWindow();
}
var arrProto = window.Array.prototype,
    strProto = window.String.prototype,
    objProto = window.Object.prototype,
    hasProp = ({}).hasOwnProperty,
    forEach = arrProto.forEach,
    def = window.Object.defineProperty,
    defs = window.Object.defineProperties,
    getObjKeys = window.Object.keys,
    isArray = window.Array.isArray,
    isIE = !+'\v1',
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
          if (hasProp.call(properties, name)) {
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
      var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
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
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
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
  strProto.splice = function(start, length, replacement) {
    replacement = replacement || '';
    return this.substr(0, start) + replacement + this.substr(start + length);
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
      if (!hasProp.call(obj, name)) continue;
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
  if (!es) return;
  model.watch(bindValues, function() {
    try {
      obj[attr] = runWithScope(es, scope);
    } catch(e) {
      console.log(e);
    }
  });
}

module.exports = {
  arrProto: arrProto,
  strProto: strProto,
  objProto: objProto,
  hasProp: hasProp,
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