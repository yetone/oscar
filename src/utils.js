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

function getType(obj) {
  return objProto.toString.call(obj).slice(8, -1);
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
  getType: getType,
  WIN: WIN,
  DOC: WIN.document
};
