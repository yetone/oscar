/**
 * Created by yetone on 14-10-11.
 */
var Store = require('./store').Store;
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
