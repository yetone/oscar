/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../utils');

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
