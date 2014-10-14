/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var ocls = $node.getAttribute(model.prefix + 'class'),
        bindValues = model.getBindValues('{{' + ocls + '}}', scope);
    utils.watch(bindValues, function() {
      var classObj = utils.runWithScope('(' + ocls + ')', scope);
      utils.forEach(classObj, function(v, cls) {
        if (v === true) {
          $node.classList.add(cls);
        } else {
          $node.classList.remove(cls);
        }
      });
    }, scope);
  }
};
