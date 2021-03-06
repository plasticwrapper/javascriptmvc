steal.apps('jquery','jquery/event/livehack').then(function(){
	var $ = jQuery,
		event = jQuery.event, 
		handle  = event.handle,
		onmouseenter = function(ev){
			//now start checking mousemoves to update location
			var delegate = ev.data.delegate;
			var selector = ev.data.selector;
			var loc = {
					pageX : ev.pageX,
					pageY : ev.pageY
				}, 
				dist = 0, 
				timer, 
				entered = this, 
				called = false,
				lastEv = ev;
			$(entered).bind("mousemove.specialMouseEnter", {}, function(ev){
				dist += Math.pow( ev.pageX-loc.pageX, 2 ) + Math.pow( ev.pageY-loc.pageY, 2 ); 
				loc = {
					pageX : ev.pageX,
					pageY : ev.pageY
				}
				lastEv = ev
			}).bind("mouseleave.specialMouseLeave",{}, function(ev){
				clearTimeout(timer);
				if(called){
					$.each(event.find(delegate, ["hoverleave"], selector), function(){
						this.call(entered, ev)
					})
				}
				$(entered).unbind("mouseleave.specialMouseLeave")
			})
			timer = setTimeout(function(){
				//check that we aren't moveing around
				
				if(dist < 10 && $(entered).queue().length == 0){
					//trigger mouseenter
					$.each(event.find(delegate, ["hoverenter"], selector), function(){
						this.call(entered, lastEv)
					})
					called = true;
					$(entered).unbind("mousemove.specialMouseEnter")
					
				}else{
					dist = 0;
					timer = setTimeout(arguments.callee, 100)
				}
				
				
			}, 100)
		};
		event.setupHelper( ["hoverenter","hoverleave","hovermove"], "mouseenter", onmouseenter )
		

	
})