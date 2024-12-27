tinymce.init({
  selector: '#editable',
  plugins: 'lists link image table code help wordcount',
  setup: function(editor) {
    editor.on('change', function() {
      editor.save();
    });
  },
});
