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
