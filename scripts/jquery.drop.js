(function($){
  function dragEnter(e) {
    e.stopPropagation();
    e.preventDefault();
    return false;
  };

  function dragOver(e) {
    e.originalEvent.dataTransfer.dropEffect = "copy";
    if (!$(this).hasClass("dragOver"))
      $(this).addClass("dragOver");
    e.stopPropagation();
    e.preventDefault();
    return false;
  };

  function dragLeave(e) {
    if ($(this).hasClass("dragOver"))
      $(this).removeClass("dragOver");
    e.stopPropagation();
    e.preventDefault();
    return false;
  };

  $.fn.dropArea = function(){
    this.bind("dragenter", dragEnter).
         bind("dragover",  dragOver).
         bind("dragleave", dragLeave);
    return this;
  };
})(jQuery);
