window.onload = function() {
    var data = {
        truncate: function (v) {
          var newline = v.indexOf('\n');
          return newline > 0 ? v.slice(0, newline) : v;
        },
        formatDate: function (v) {
          return v.replace(/T|Z/g, ' ');
        },
        fetchData: function(branch) {
          var xhr = new XMLHttpRequest(),
              self = this;
          xhr.open('GET', 'https://api.github.com/repos/yetone/oscar/commits?per_page=6&sha=' + branch);
          xhr.onload = function () {
              data.commits = JSON.parse(xhr.responseText);
          };
          xhr.send();
        },
        commits: []
    };

    var oscar = new Oscar();
    oscar.modelRegister({
      el: '#demo',
      data: data
    });

    window.data = data;
};
