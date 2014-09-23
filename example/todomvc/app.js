function onLoad() {
  var data = {
    todos: [],
    filterTodos: [],
    filter: 'all',
    remaining: 0,
    pluralize: function(txt, count) {
      if (count > 1) {return txt + 's'};
      return txt;
    },
    editedTodo: null,
    editTodo: function(index) {
      data.filterTodos[index].editing = true;
    },
    removeTodo: function(index) {
      data.filterTodos.splice(index, 1);
    },
    allDone: function() {
      data.filterTodos.forEach(function(d) {
        d.completed = true;
      });
    }
  };
  document.getElementById('new-todo').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
      var title = this.value;
      var todo = {
        title: title,
        completed: false,
        editing: false
      };
      data.todos.push(todo);
      data.filterTodos.push(todo);
    }
  });
  var oscar = new Oscar();
  var model = oscar.modelRegister({
    el: '#todoapp',
    data: data
  });
  model.watch('filterTodos', function() {
    data.remaining = data.filterTodos.length;
  });
  window.data = data;
  window.model = model;
}

window.onload = onLoad;
