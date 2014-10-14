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
  proto.getBindValues = function(txt, scope) {
    var scope = scope || this.data,
        m = txt.match(/\{\{.*?\}\}/g),
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
})(Observer);

module.exports = Model;
