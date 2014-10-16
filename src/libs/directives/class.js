/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(vm, $node, scope) {
    var ocls = $node.getAttribute(vm.prefix + 'class'),
        paths = vm.getPaths('{{' + ocls + '}}', scope);
    utils.watch(paths, function() {
      var classObj = utils.runWithScope('({' + ocls + '})', scope);
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
