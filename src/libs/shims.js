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
