/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var exp = utils.parseExp($node.getAttribute(model.prefix + 'if')),
      $tmp = $node,
      $ps = $node.previousSibling,
      $ns = $node.nextSibling,
      $pn = $node.parentNode,
      removed = false,
      bindValues = model.getBindValues('{{' + exp + '}}', scope);
    model.watch(bindValues, function() {
      if (utils.runWithScope(exp, scope)) {
        if (!removed) return;
        var $node0 = $tmp;
        if ($ps && $ps.nextSibling) {
          $pn.insertBefore($node0, $ps.nextSibling);
        } else if ($ns) {
          $pn.insertBefore($node0, $ns);
        } else if ($pn) {
          $pn.appendChild($node0);
        }
        model.render($node0, null, true);
        $node = $node0;
        $tmp = $node;
        removed = false;
      } else {
        dom.removeElement($node);
        removed = true;
      }
    });
  }
};
