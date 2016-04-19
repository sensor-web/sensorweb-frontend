(function(){

	var $toc = $('.toc .collection');
	var $tocItems = $toc.find('.collection-item');

	$toc.pushpin({ top: $('.toc').offset().top, offset: 68});

	$.localScroll({
		queue:true,
		duration:200,
		hash:true,
		onAfter: function(element) {
		  	$tocItems.removeClass('active');
			$toc.find('[href=#'+element.attr('id')+']').addClass('active');
		}
	});

	var waypoints = $('h2, h3').waypoint({
	  handler: function(direction) {
	  	$tocItems.removeClass('active');
	  	$toc.find('[href=#'+this.element.id+']').addClass('active');
	  }
	});

})();
