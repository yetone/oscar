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
  ArrayProxy[method] = function() {
    var self = this;
    var oldL = self.length;
    args = utils.toArray(arguments);
    switch (method) {
      case 'splice':
        utils.forEach(utils.range(args[0], args[1]), function(v) {
          self.__observer__.trigger('remove:' + v);
          self.__observer__.off('set:' + v);
          self.__observer__.off('change:' + v);
        });
        break;
      case 'pop':
        self.__observer__.trigger('remove:' + (this.length - 1));
        self.__observer__.off('set:' + (this.length - 1));
        self.__observer__.off('change:' + (this.length - 1));
        break;
      case 'shift':
        self.__observer__.trigger('remove:0');
        self.__observer__.off('set:0');
        self.__observer__.off('change:0');
        break;
    }
    utils.arrProto[method].apply(this, args);
    if (oldL !== this.length) {
      self.__observer__.trigger('change:length');
    }
  };
});
ObjectProxy.$watch = function() {
  if (!this.__observer__) {
    return console.warn('no observer!');
  }
  this.__observer__.watch.apply(this.__observer__, arguments);
};
ObjectProxy.$trigger = function() {
  if (!this.__observer__) {
    return console.warn('no observer!');
  }
  this.__observer__.trigger.apply(this.__observer__, arguments);
};

function canBuild(obj) {
  return typeof obj === 'object' && obj && !obj.__observer__;
}

function buildObj(obj, parent) {
  var properties = {};
  if (obj.__observer__ === undefined || obj.__observer__.constructor !== Observer) {
    obj.__observer__ = new Observer(obj);
    if (parent && parent.__observer__) {
      obj.__observer__.__parent__ = parent.__observer__;
    }
  }
  utils.forEach(obj, function(v, k) {
    if (k === '__observer__') return;
    if (utils.isStr(k) && k.startsWith('$')) return;
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
