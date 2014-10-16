var ViewModel = require('./libs/viewmodel'),
    builder = require('./libs/builder'),
    shims = require('./libs/shims'),
    dom = require('./libs/dom'),
    utils = require('./utils');

// do shim
shims.shim();
(function(window, undefined) {
  window.Oscar = (function() {
    function Oscar(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new TypeError('invalid vm type');
      }
      var $els = dom.querySelectorAll(utils.$DOC, obj.el);
      if (!$els.length) {
        throw new Error('cannot find the element');
      }
      var $el = $els[0],
          vm;
      vm = new ViewModel({
        $el: $el,
        data: obj.data
      });
      builder.buildObj(vm.data);
      vm.render();
      vm.inited = true;
      return vm;
    }
    return Oscar;
  })();
})(utils.WIN);
