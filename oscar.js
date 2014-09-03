;(function(window, undefined) {
  window.Oscar = (function() {
    function Oscar() {
      this.modelList = [];
      this.__init__();
    }
    var proto = Oscar.prototype;
    proto.__init__ = function() {
      this.watcher();
    };
    proto.modelRegister = function(obj) {
      if (typeof obj !== 'object' || typeof obj.el !== 'string' ||  typeof obj.data !== 'object') {
        throw new Error('invailed model type');
      }
      var $el = window.document.querySelectorAll(obj.el);
      if (!$el.length) {
        throw new Error('cannot find the element');
      }
      this.modelList.push({
        $el: $el[0],
        tpl: $el[0].innerHTML,
        data: obj.data
      });
    };
    proto.watcher = function() {
      var self = this;
      window.setInterval(function() {
        self.modelList.forEach(function(e) {
          e.$el.innerHTML = window.shani.compile(e.tpl.replace(/&gt;/g, '>').replace(/&lt;/g, '<'))(e.data);
        });
      }, 100);
    };
    return Oscar;
  })();
})(window);
