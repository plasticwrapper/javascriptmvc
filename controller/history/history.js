steal.plugins('jquery/controller/subscribe','jquery/event/hashchange').then(function($){
	var rsplit = function(string, regex) {
		var result = regex.exec(string),retArr = new Array(), first_idx, last_idx, first_bit;
		while (result != null)
		{
			first_idx = result.index; last_idx = regex.lastIndex;
			if ((first_idx) != 0)
			{
				first_bit = string.substring(0,first_idx);
				retArr.push(string.substring(0,first_idx));
				string = string.slice(first_idx);
			}		
			retArr.push(result[0]);
			string = string.slice(result[0].length);
			result = regex.exec(string);	
		}
		if (! string == '')
		{
			retArr.push(string);
		}
		return retArr;
	}
	
	$.Path = function(path) {
		this.path = path;
	};
	
	$.Path.prototype = {
		domain : function() {
			var lhs = this.path.split('#')[0];
			return '/'+lhs.split('/').slice(3).join('/');
		},
		folder : function() {
			var first_pound = this.path.indexOf('#');
			if( first_pound == -1) return null;
			var after_pound =  this.path.substring( first_pound+1 );
			
			var first_amp = after_pound.indexOf("&");
			if(first_amp == -1 ) return after_pound.indexOf("=") != -1 ? null : after_pound;
			
			return after_pound.substring(0, first_amp);
		},
		//types of urls
		//  /someproject#action/controller&doo_doo=butter
		//  /someproject#doo_doo=butter
		params : function() {
			var first_pound = this.path.indexOf('#');
			if( first_pound == -1) return null;
			var after_pound =  this.path.substring( first_pound+1 );
			
			//now either return everything after the first & or everything
			var first_amp = after_pound.indexOf("&");
			if(first_amp == -1 ) return after_pound.indexOf("=") != -1 ? after_pound : null;
			
			return ( after_pound.substring(0,first_amp).indexOf("=") == -1 ? after_pound.substring(first_amp+1) : after_pound );
			 
		}
	};

	$.Path.get_data = function(path) {
		var search = path.params();
		if(! search || ! search.match(/([^?#]*)(#.*)?$/) ) return {};
	   
		// Support the legacy format that used MVC.Object.to_query_string that used %20 for
		// spaces and not the '+' sign;
		search = search.replace(/\+/g,"%20")
	   
		var data = {};
		var parts = search.split('&');
		for(var i=0; i < parts.length; i++){
			var pair = parts[i].split('=');
			if(pair.length != 2) continue;
			var key = decodeURIComponent(pair[0]), value = decodeURIComponent(pair[1]);
			var key_components = rsplit(key,/\[[^\]]*\]/);
			
			if( key_components.length > 1 ) {
				var last = key_components.length - 1;
				var nested_key = key_components[0].toString();
				if(! data[nested_key] ) data[nested_key] = {};
				var nested_hash = data[nested_key];
				
				for(var k = 1; k < last; k++){
					nested_key = key_components[k].substring(1, key_components[k].length - 1);
					if( ! nested_hash[nested_key] ) nested_hash[nested_key] ={};
					nested_hash = nested_hash[nested_key];
				}
				nested_hash[ key_components[last].substring(1, key_components[last].length - 1) ] = value;
			} else {
		        if (key in data) {
		        	if (typeof data[key] == 'string' ) data[key] = [data[key]];
		         	data[key].push(value);
		        }
		        else data[key] = value;
			}
			
		}
		return data;
	}
	




	jQuery(function($) {
	   $(window).hashchange(function() {
		   
		   var path = new $.Path(location.href);
		   var data = $.Path.get_data(path);
		   var folders = path.folder() || 'index';
	
	      var hasSlash = (folders.indexOf('/') != -1);
	
	      if(!hasSlash) {
	         if(folders != 'index')
	            folders += '/index';
	      }
		  
	      OpenAjax.hub.publish("history."+folders.replace("/","."), data);
	   });
	
	   $.History.init();
	});




$.extend($.Controller.prototype, {
   /**
    * Redirects to another page.
    * @plugin 'dom/history'
    * @param {Object} options an object that will turned into a url like #controller/action&param1=value1
    */
   redirectTo: function(options){
	   var point = this._get_history_point(options);
      $.History.add(point);
//      location.hash = point;
//	   var location = window.location.href.split('#')[0];   
//	   window.location = location + point;
   },
   /**
    * Redirects to another page by replacing current URL with the given one.  This
    * call will not create a new entry in the history.
    * @plugin 'dom/history'
    * @param {Object} options an object that will turned into a url like #controller/action&param1=value1
    */
   replaceWith: function(options){
	   var point = this._get_history_point(options);
      $.History.replace(point);
   },
   /**
    * Adds history point to browser history.
    * @plugin 'dom/history'
    * @param {Object} options an object that will turned into a url like #controller/action&param1=value1
    * @param {Object} data extra data saved in history  -- NO LONGER SUPPORTED
    */
   history_add : function(options, data) {
	   var point = this._get_history_point(options);
      $.History.add(point);
//	   MVC.History.add(point, data)
   },
   /**
    * Creates a history point from given options. Resultant history point is like #controller/action&param1=value1
    * @plugin 'dom/history'
    * @param {Object} options an object that will turned into history point
    */
   _get_history_point: function(options) {
	   var controller_name = options.controller || this.Class.underscoreName;
	   var action_name = options.action || 'index';
      
	   /* Convert the options to parameters (removing controller and action if needed) */
	   if(options.controller)
		   delete options.controller;
	   if(options.action)
		   delete options.action;
	   
	   var paramString = (options) ? $.param(options) : '';
	   if(paramString.length)
		   paramString = '&' + paramString;
	   
	   return '#' + controller_name + '/' + action_name + paramString;
   },

   /**
    * Creates MVC.Path wrapper for current window.location
    * @plugin 'dom/history'
    */
   path : function() {
	   return new $.Path(location.href);
   },

   /**
    * Provides current window.location parameters as object properties.
    * @plugin 'dom/history'
    */
   path_data :function() {
	   return $.Path.get_data(this.path());
   }
});
		
	
})
