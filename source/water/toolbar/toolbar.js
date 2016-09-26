/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

(function(angular) {

'use strict';

angular.module("water.toolbar", [])

.directive("icsmToolbar", [function() {
	return {
		controller: 'toolbarLinksCtrl'
	};
}])


/**
 * Override the default mars tool bar row so that a different implementation of the toolbar can be used.
 */
.directive('icsmToolbarRow', [function() {
	return {
		scope:{
			map:"="
		},
		restrict:'AE',
		templateUrl:'water/toolbar/toolbar.html'
	};
}])

.controller("toolbarLinksCtrl", ["$scope", "configService", function($scope, configService) {

	var self = this;
	configService.getConfig().then(function(config) {
		self.links = config.toolbarLinks;
	});

	$scope.item = "";
	$scope.toggleItem = function(item) {
		$scope.item = ($scope.item === item) ? "" : item;
	};

}]);

})(angular);