/**
 * Created by yetone on 14-10-11.
 */
var Observer = require('./observer');
var utils = require('../utils');
var undefined;

function buildArray(arr) {
  var args;
  utils.forEach(['push', 'pop', 'shift', 'unshift', 'splice'], function(method) {
    arr[method] = function() {
      var oldL = this.length;
      args = utils.toArray(arguments);
      utils.arrProto[method].apply(this, args);
      buildObj(this);
      if (oldL !== this.length) {
        arr.__observer__.trigger('change:length');
      }
    };
  });
  buildObj(arr);
}

function buildObj(obj) {
  var properties = {};
  if (obj.__observer__ === undefined || obj.__observer__.constructor !== Observer) {
    obj.__observer__ = new Observer(obj);
  }
  utils.forEach(obj, function(v, k) {
    if (k === '__observer__') return;
    if (typeof v === 'function') return;
    obj.__observer__.store.set(k, v);
    if (utils.isArray(v)) {
      buildArray(v);
    }
    if (utils.isObj(v)) {
      buildObj(v);
    }
    properties[k] = {
      get: function() {
        return this.__observer__.store.get(k);
      },
      set: function(value) {
        if (utils.isArray(value)) {
          buildArray(value);
        }
        if (utils.isObj(value)) {
          buildObj(value);
        }
        var isNew = (this.__observer__.store.get(k) !== value);
        this.__observer__.store.set(k, value);
        if (isNew) {
          this.__observer__.trigger('change:' + k);
          this.__observer__.trigger('change:*');
        }
      }
    };
    obj.__observer__.trigger('set:' + k);
  });
  utils.defs(obj, properties);
}

module.exports = {
  buildObj: buildObj
};
