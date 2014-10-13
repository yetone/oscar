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
