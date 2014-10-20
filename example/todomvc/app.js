function onLoad() {
  var data = {
    todos: JSON.parse(window.localStorage.getItem('todos-oscarjs') || '[]'),
    filter: 'all',
    remaining: 0,
    completedCount: 0,
    pluralize: function(txt, count) {
      if (count > 1) return txt + 's';
      return txt;
    },
    editedTodo: null,
    editTodo: function(todo) {
      todo.editing = true;
    },
    removeTodo: function(idx) {
      data.todos.splice(idx, 1);
    },
    completeTodo: function(todo, bool) {
      todo.completed = bool;
    },
    allDone: function() {
      var bool = data.todos.some(function(v) {return !v.completed});
      data.todos.forEach(function(todo) {
        data.completeTodo(todo, bool)
      });
    },
    submitEdit: function(todo, $this, $event) {
      if ($event.keyCode === 13) {
        todo.title = $this.value;
        todo.editing = false;
      }
    },
    removeCompleted: function() {
      data.todos.forEach(function(todo) {
        todo.completed && (data.removeTodo(todo));
      });
    },
    addTodo: function(e) {
      if (e.keyCode === 13) {
        var title = this.value;
        var todo = {
          title: title,
          hide: false,
          completed: false,
          editing: false,
          removed: false
        };
        data.todos.push(todo);
        this.value = '';
      }
    }
  };
  var vm = new Oscar({
    el: '#todoapp',
    data: data
  });
  function filter() {
    switch (data.filter) {
      case 'all':
        data.todos.forEach(function(todo) {
          todo.hide = false;
        });
        break;
      case 'active':
        data.todos.forEach(function(todo) {
          todo.hide = false;
          if (todo.completed) todo.hide = true;
        });
        break;
      case 'completed':
        data.todos.forEach(function(todo) {
          todo.hide = false;
          if (!todo.completed) todo.hide = true;
        });
        break;
    }
  }
  data.$watch('filter', filter);
  window.data = data;
  window.vm = vm;
}

window.onload = onLoad;
