/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');

module.exports = {
  compile: function(model, $node, scope) {
    var oact = $node.getAttribute(model.prefix + 'action'),
        acl = /(\w+):(.*)/g.exec(oact);
    if (acl.length === 3) {
      $node.addEventListener(acl[1], function(e) {
        utils.runWithEvent(acl[2], scope, this, e);
      });
    }
  }
};
