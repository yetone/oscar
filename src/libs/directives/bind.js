/**
 * Created by yetone on 14-10-10.
 */
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var bind = utils.getBind($node),
        eventType = utils.getEventType($node),
        multiple = $node.hasAttribute('multiple'),
        bindValue = $node.getAttribute(model.prefix + 'bind'),
        path = utils.genPath(bindValue);
    if (!bind) return;
    if (multiple) {
      model.watch(path, function() {
        var $opts = utils.toArray($node.options);
        $opts.forEach(function($opt) {
          $opt.selected = eval('(scope' + utils.genS(path) + '.indexOf($opt.value) >= 0)');
        });
      });
      if (eventType) {
        utils.addEventListener($node, eventType, function() {
          var $selectedOpts = utils.toArray($node.selectedOptions),
            acc = [],
            es;
          $selectedOpts.forEach(function($opt) {
            if ($opt.selected) {
              acc.push($opt.value);
            }
          });
          es = '(scope' + utils.genS(path) + ' = acc)';
          eval(es);
        });
      }
    } else {
      model.watch(path, function() {
        if ($node.type === 'radio') {
          $node[bind] = eval('(scope' + utils.genS(path) + ' === $node.value)');
        } else {
          $node[bind] = utils.runWithScope(bindValue, scope);
        }
      });
      if (path !== path.split('.')[0]) {
        model.watch(path.split('.')[0], function() {
          $node[bind] = utils.runWithScope(bindValue, scope);
        });
      }
      if (eventType) {
        utils.addEventListener($node, eventType, function() {
          var es;
          if ($node.type === 'radio') {
            es = '(scope.' + bindValue + ' = this.value)';
          } else {
            es = '(scope.' + bindValue + ' = this.' + bind + ')';
          }
          eval(es);
        });
      }
    }
  }
};
