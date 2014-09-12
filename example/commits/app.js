window.onload = function() {
    var data = {
        truncate: function (v) {
          var newline = v.indexOf('\n');
          return newline > 0 ? v.slice(0, newline) : v;
        },
        formatDate: function (v) {
          return v.replace(/T|Z/g, ' ');
        },
        branch: 'master',
        loading: false,
        commits: []
    };

    var oscar = new Oscar();
    window.model = oscar.modelRegister({
      el: '#demo',
      data: data
    });
    var fetchData = function() {
      var xhr = new XMLHttpRequest(),
          self = this;
      data.loading = true;
      xhr.open('GET', 'https://api.github.com/repos/yetone/oscar/commits?per_page=6&sha=' + data.branch);
      xhr.onload = function () {
        data.loading = false;
        data.commits = JSON.parse(xhr.responseText);
      };
      xhr.send();
    }
    model.watch('branch', function() {
      fetchData();
    });
    // debug
    window.data = data;
};
