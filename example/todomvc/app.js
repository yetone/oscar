function onLoad() {
  var data = {
    todos: [],
    filterTodos: [],
    filter: 'all',
    remaining: 0,
    pluralize: function(txt, count) {
      if (count > 1) return txt + 's';
      return txt;
    },
    editedTodo: null,
    editTodo: function(todo) {
      todo.editing = true;
    },
    removeTodo: function(todo) {
      todo.removed = true
    },
    allDone: function() {
      data.filterTodos.forEach(function(d) {
        d.completed = !d.completed;
      });
    }
  };
  document.getElementById('new-todo').addEventListener('keydown', function(e) {
    if (e.keyCode === 13) {
      var title = this.value;
      var todo = {
        title: title,
        completed: false,
        editing: false,
        removed: false
      };
      data.todos.push(todo);
      this.value = '';
    }
  });
  var oscar = new Oscar();
  var model = oscar.modelRegister({
    el: '#todoapp',
    data: data
  });
  function filter() {
    switch (data.filter) {
      case 'all':
        data.filterTodos = data.todos;
        break;
      case 'active':
        data.filterTodos = data.todos.filter(function(v) {
          return !v.completed;
        });
        break;
      case 'completed':
        data.filterTodos = data.todos.filter(function(v) {
          return v.completed;
        });
        break;
    }
  }
  model.watch('todos', function() {
    data.filterTodos = data.todos;
  });
  model.watch('filter', filter);
  model.watch('filterTodos', function() {
    data.remaining = data.filterTodos.length;
  });
  window.data = data;
  window.model = model;
}

window.onload = onLoad;
