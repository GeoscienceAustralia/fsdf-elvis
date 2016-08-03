(function(angular) {

'use strict';

angular.module("ImageryApp", [
	 	'common.altthemes',
	 	'common.header',
      'common.navigation',
      'common.templates',
	 	'common.toolbar',

      'explorer.config',
      'explorer.confirm',
	 	'explorer.drag',
	 	'explorer.enter',
      'explorer.flasher',
      'explorer.googleanalytics',
	 	'explorer.httpdata',
	 	'explorer.info',
      'explorer.legend',
      'explorer.message',
	 	'explorer.modal',
	 	'explorer.persist',
	 	'explorer.projects',
	 	'explorer.tabs',
	 	'explorer.version',
	 	'exp.ui.templates',

	 	'ui.bootstrap',
	 	'ui.bootstrap-slider',
      'ngAutocomplete',
	 	'ngRoute',
	 	'ngSanitize',
	 	'page.footer'

])

// Set up all the service providers here.
.config(['configServiceProvider', 'persistServiceProvider', 'projectsServiceProvider', 'versionServiceProvider',
         function(configServiceProvider, persistServiceProvider, projectsServiceProvider, versionServiceProvider) {
	configServiceProvider.location("icsm/resources/config/config.json");
   configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");
	versionServiceProvider.url("icsm/assets/package.json");
	persistServiceProvider.handler("local");
	projectsServiceProvider.setProject("icsm");
}])

.factory("userService", [function() {
	return {
		login : noop,
		hasAcceptedTerms : noop,
		setAcceptedTerms : noop,
		getUsername : function() {
			return "anon";
		}
	};
	function noop() {return true;}
}])

.controller("RootCtrl", RootCtrl);

RootCtrl.$invoke = ['$http', 'configService'];
function RootCtrl($http, configService) {
	var self = this;
	configService.getConfig().then((data) => {
		self.data = data;
		// If its got WebGL its got everything we need.
		try {
			var canvas = document.createElement( 'canvas' );
			data.modern = !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
		} catch ( e ) {
			data.modern = false;
		}
	});
}


})(angular);