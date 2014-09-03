// example
window.onload = function() {
  window.data = {
    name: 'yetone',
    age: 23,
    skills: [
      'Python',
      'Golang',
      'JavaScript'
    ],
    say: function() {
      return 'It works!';
    },
    dict: {
      a: 1,
      b: 2,
      3: 'c'
    }
  };
  var oscar = new Oscar;
  oscar.modelRegister({
    el: '#model',
    data: data
  });
  var ago = new Date().getTime();
};
