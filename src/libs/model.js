/**
 * Created by yetone on 14-10-10.
 */
var config = require('../config');
var compiler = require('./compiler');
var utils = require('../utils');
var undefined;

var Model = (function() {
  function Model(obj) {
    this.$el = obj.$el;
    this.tpl = obj.tpl;
    this.data = obj.data;
    this.inited = obj.inited || false;
    this.prefix = obj.prefix || config.PREFIX;
  }
  var proto = Model.prototype;
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
  return Model;
})();

module.exports = Model;
