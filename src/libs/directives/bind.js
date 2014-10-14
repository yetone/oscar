/**
 * Created by yetone on 14-10-10.
 */
var dom = require('../dom');
var utils = require('../../utils');
var undefined;

module.exports = {
  compile: function(model, $node, scope) {
    var bind = utils.getBind($node),
        eventType = utils.getEventType($node),
        multiple = dom.hasAttribute($node, 'multiple'),
        bindValue = $node.getAttribute(model.prefix + 'bind'),
        path = utils.genPath(bindValue);
    if (!bind) return;
    if (multiple) {
      utils.watch([path], function() {
        var $opts = utils.toArray($node.options);
        $opts.forEach(function($opt) {
          $opt.selected = eval('(scope' + utils.genS(path) + '.indexOf($opt.value) >= 0)');
        });
      }, scope);
      if (eventType) {
        dom.addEventListener($node, eventType, function() {
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
      utils.watch([path], function() {
        if ($node.type === 'radio') {
          $node[bind] = eval('(scope' + utils.genS(path) + ' === $node.value)');
        } else {
          $node[bind] = utils.runWithScope(bindValue, scope);
        }
      }, scope);
      if (eventType) {
        dom.addEventListener($node, eventType, function() {
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
