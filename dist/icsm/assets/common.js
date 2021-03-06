/**
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

"use strict";

{
  /**
   * Uses: https://raw.githubusercontent.com/seiyria/angular-bootstrap-slider
   */
  angular.module('common.baselayer.control', ['geo.maphelper', 'geo.map', 'common.slider']).directive('commonBaselayerControl', ['mapHelper', 'mapService', function (mapHelper, mapService) {
    var DEFAULTS = {
      maxZoom: 12
    };
    return {
      template: '<slider ui-tooltip="hide" min="0" max="1" step="0.1" ng-model="slider.opacity" updateevent="slideStop"></slider>',
      scope: {
        maxZoom: "="
      },
      link: function link(scope, element) {
        if (typeof scope.maxZoom === "undefined") {
          scope.maxZoom = DEFAULTS.maxZoom;
        }

        scope.slider = {
          opacity: -1,
          visibility: true,
          lastOpacity: 1
        }; // Get the initial value

        mapHelper.getPseudoBaseLayer().then(function (layer) {
          scope.layer = layer;
          scope.slider.opacity = layer.options.opacity;
        });
        scope.$watch('slider.opacity', function (newValue, oldValue) {
          if (oldValue < 0) return;
          mapService.getMap().then(function (map) {
            map.eachLayer(function (layer) {
              if (layer.pseudoBaseLayer) {
                layer.setOpacity(scope.slider.opacity);
              }
            });
          });
        });
      }
    };
  }]);
}
"use strict";

{
  var versions = {
    3: {
      version: "3.0",
      link: "https://creativecommons.org/licenses/by/3.0/au/"
    },
    4: {
      version: "4.0",
      link: "https://creativecommons.org/licenses/by/4.0/"
    }
  };
  angular.module("common.cc", []).directive('commonCc', [function () {
    return {
      templateUrl: 'common/cc/cc.html',
      scope: {
        version: "=?"
      },
      link: function link(scope) {
        if (!scope.version) {
          scope.details = versions[4];
        } else {
          scope.details = versions[scope.version];
        }

        scope.template = 'common/cc/cctemplate.html';
      }
    };
  }]);
}
"use strict";

{
  var captured = function captured(twoDates) {
    var dates = twoDates.split(" - ");

    if (dates.length !== 2) {
      return twoDates;
    }

    return formatDate(dates[0]) + " - " + formatDate(dates[1]);
  };

  var formatDate = function formatDate(data) {
    if (data.length !== 8) {
      return data;
    }

    return data.substr(0, 4) + "/" + data.substr(4, 2) + "/" + data.substr(6, 2);
  };

  angular.module("common.featureinf", []).directive("commonFeatureInf", ['$http', '$log', '$q', '$timeout', 'featureInfService', 'flashService', 'mapService', 'messageService', function ($http, $log, $q, $timeout, featureInfoService, flashService, mapService, messageService) {
    var template = "https://elvis2018-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_ElevationAvailableData.fmw?" + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=${bounds}&WIDTH=${width}&HEIGHT=${height}" + //"LAYERS=public.5dem_ProjectsIndex&" +
    "&LAYERS=public.QLD_Elevation_Metadata_Index,public.ACT2015-Tile_Index_55,public.5dem_ProjectsIndex,public.NSW_100k_Index_54,public.NSW_100k_Index_55," + "public.NSW_100k_Index_56,public.NSW_100k_Index_Forward_Program,public.QLD_Project_Index_54," + "public.QLD_Project_Index_55,public.QLD_Project_Index_56,public.TAS_Project_Index_55," + "public.GA_Project_Index_47,public.GA_Project_Index_48,public.GA_Project_Index_54," + "public.GA_Project_Index_55,public.GA_Project_Index_56" + "&STYLES=&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=${x}&Y=${y}";
    var layers = ["public.5dem_ProjectsIndex", "public.NSW_100k_Index"];
    return {
      restrict: "AE",
      templateUrl: "common/featureinf/featureinf.html",
      link: function link(scope, element, attrs, ctrl) {
        var flasher = null;
        scope.features = null;
        scope.captured = captured;
        scope.formatDate = formatDate;

        if (typeof scope.options === "undefined") {
          scope.options = {};
        }

        mapService.getMap().then(function (map) {
          map.on('popupclose', function (e) {
            featureInfoService.removeLastLayer(map);
          });

          scope.close = function () {
            featureInfoService.removeLastLayer(map);
            featureInfoService.removePolygon();
            scope.features = null;
          };

          scope.entered = function (feature) {
            featureInfoService.showPolygon(map, feature);
          };

          scope.left = function (feature) {
            featureInfoService.removePolygon();
          };

          map.on("draw:drawstart point:start", function () {
            scope.paused = true;
          });
          map.on("draw:drawstop point:end", function () {
            // Argh. Can't get an event that runs before the click on draw but
            // if I wait a few milliseconds then all is good.
            $timeout(function () {
              scope.paused = false;
            }, 6);
          });
          map.on("click", function (event) {
            if (scope.paused) {
              return;
            }

            console.log("clicked feature info");
            var layer = null;
            var size = map.getSize();
            var bds = map.getBounds();
            var w = bds.getNorthEast().lng - bds.getSouthWest().lng;
            var h = bds.getNorthEast().lat - bds.getSouthWest().lat;
            var X2 = ((event.latlng.lng - bds.getSouthWest().lng) / w * size.x).toFixed(0);
            var Y2 = ((bds.getNorthEast().lat - event.latlng.lat) / h * size.y).toFixed(0);
            var data = {
              x: X2,
              //point.x,
              y: Y2,
              //point.y,
              bounds: bds.toBBoxString(),
              height: size.y,
              width: size.x
            };
            var url = template;
            flashService.remove(flasher);
            flasher = flashService.add("Checking available data at this point", 30000, true);
            angular.forEach(data, function (value, key) {
              url = url.replace("${" + key + "}", value);
            });
            $http.get(url).then(function (httpResponse) {
              var group = httpResponse.data;
              var response;
              var features;
              console.log(group);
              featureInfoService.removeLastLayer(map);
              flashService.remove(flasher);

              if (!group.length) {
                flasher = flashService.add("No status information available for this point.", 4000);
                response = httpResponse;
                scope.features = null;
              } else {
                response = {
                  data: {
                    name: "public.AllIndexes",
                    type: "FeatureCollection",
                    crs: {
                      type: "name",
                      properties: {
                        name: "EPSG:4326"
                      }
                    },
                    features: []
                  }
                };
                features = response.data.features;
                group.forEach(function (response) {
                  response.features.forEach(function (feature) {
                    features.push(feature);
                    var contact = feature.properties.contact;

                    if (contact) {
                      feature.properties.contact = contact.toLowerCase().indexOf("mailto:") === 0 ? "" : "mailto:" + contact;
                    }
                  });
                });
                scope.features = features;

                if (features.length) {
                  layer = L.geoJson(response.data, {
                    style: function style(feature) {
                      return {
                        fillOpacity: 0.1,
                        color: "red"
                      };
                    }
                  }).addTo(map);
                  featureInfoService.setLayer(layer);

                  if (features.length < 3) {
                    scope.d1Height = "fi-d1x" + features.length;
                  } else {
                    scope.d1Height = "fi-d1xb";
                  }
                }
              }
            });
          });
        });
      }
    };
  }]).factory('featureInfService', [function () {
    var lastFeature = null;
    var polygon = null;
    return {
      setLayer: function setLayer(layer) {
        lastFeature = layer;
      },
      removeLastLayer: function removeLastLayer(map) {
        if (lastFeature) {
          map.removeLayer(lastFeature);
          lastFeature = null;
        }
      },
      showPolygon: function showPolygon(map, feature) {
        polygon = L.geoJson({
          type: "FeatureCollection",
          features: [feature]
        }, {
          color: 'green'
        }).addTo(map);
      },
      removePolygon: function removePolygon() {
        if (polygon) {
          polygon.remove();
          polygon = null;
        }
      }
    };
  }]);
}
"use strict";

(function (angular) {
  'use strict';

  angular.module('common.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {
    var modifyConfigSource = function modifyConfigSource(headerConfig) {
      return headerConfig;
    };

    $scope.$on('headerUpdated', function (event, args) {
      $scope.headerConfig = modifyConfigSource(args);
    });
  }]).directive('icsmHeader', [function () {
    var defaults = {
      current: "none",
      heading: "ICSM",
      headingtitle: "ICSM",
      helpurl: "help.html",
      helptitle: "Get help about ICSM",
      helpalttext: "Get help about ICSM",
      skiptocontenttitle: "Skip to content",
      skiptocontent: "Skip to content",
      quicklinksurl: "/search/api/quickLinks/json?lang=en-US"
    };
    return {
      transclude: true,
      restrict: 'EA',
      templateUrl: "common/header/header.html",
      scope: {
        current: "=",
        breadcrumbs: "=",
        heading: "=",
        headingtitle: "=",
        helpurl: "=",
        helptitle: "=",
        helpalttext: "=",
        skiptocontenttitle: "=",
        skiptocontent: "=",
        quicklinksurl: "="
      },
      link: function link(scope, element, attrs) {
        var data = angular.copy(defaults);
        angular.forEach(defaults, function (value, key) {
          if (!(key in scope)) {
            scope[key] = value;
          }
        });
      }
    };
  }]).factory('headerService', ['$http', function () {}]);
})(angular);
"use strict";

{
  angular.module('common.legend', []).directive('commonLegend', [function () {
    return {
      template: "<img ng-href='url' ng-if='url'></img>",
      scope: {
        map: "="
      },
      restrict: "AE",
      link: function link(scope) {
        if (scope.map) {}
      }
    };
  }]);
}
"use strict";

{
  angular.module('common.reset', []).directive('resetPage', function ($window) {
    return {
      restrict: 'AE',
      scope: {},
      templateUrl: 'common/reset/reset.html',
      controller: ['$scope', function ($scope) {
        $scope.reset = function () {
          $window.location.reload();
        };
      }]
    };
  });
}
"use strict";

{
  angular.module('common.altthemes', [])
  /**
  	*
  	* Override the original mars user.
  	*
  	  */
  .directive('altThemes', ['altthemesService', function (themesService) {
    return {
      restrict: 'AE',
      templateUrl: 'common/navigation/altthemes.html',
      scope: {
        current: "="
      },
      link: function link(scope) {
        themesService.getThemes().then(function (themes) {
          scope.themes = themes;
        });
        themesService.getCurrentTheme().then(function (theme) {
          scope.theme = theme;
        });

        scope.changeTheme = function (theme) {
          scope.theme = theme;
          themesService.setTheme(theme.key);
        };
      }
    };
  }]).controller('altthemesCtrl', ['altthemesService', function (altthemesService) {
    this.service = altthemesService;
  }]).filter('altthemesFilter', function () {
    return function (features, theme) {
      var response = []; // Give 'em all if they haven't set a theme.

      if (!theme) {
        return features;
      }

      if (features) {
        features.forEach(function (feature) {
          if (feature.themes) {
            if (feature.themes.some(function (name) {
              return name === theme.key;
            })) {
              response.push(feature);
            }
          }
        });
      }

      return response;
    };
  }).factory('altthemesService', ['$q', '$http', 'storageService', function ($q, $http, storageService) {
    var THEME_PERSIST_KEY = 'icsm.current.theme';
    var THEMES_LOCATION = 'icsm/resources/config/themes.json?v=1';
    var DEFAULT_THEME = "All";
    var waiting = [];
    var self = this;
    this.themes = [];
    this.theme = null;
    storageService.getItem(THEME_PERSIST_KEY).then(function (value) {
      if (!value) {
        value = DEFAULT_THEME;
      }

      $http.get(THEMES_LOCATION, {
        cache: true
      }).then(function (response) {
        var themes = response.data.themes;
        self.themes = themes;
        self.theme = themes[value]; // Decorate the key

        angular.forEach(themes, function (theme, key) {
          theme.key = key;
        });
        waiting.forEach(function (wait) {
          wait.resolve(self.theme);
        });
      });
    });

    this.getCurrentTheme = function () {
      if (this.theme) {
        return $q.when(self.theme);
      } else {
        var waiter = $q.defer();
        waiting.push(waiter);
        return waiter.promise;
      }
    };

    this.getThemes = function () {
      return $http.get(THEMES_LOCATION, {
        cache: true
      }).then(function (response) {
        return response.data.themes;
      });
    };

    this.setTheme = function (key) {
      this.theme = this.themes[key];
      storageService.setItem(THEME_PERSIST_KEY, key);
    };

    return this;
  }]).filter('altthemesEnabled', function () {
    return function (headers) {
      if (headers) {
        return headers.filter(function (value) {
          return !!value.enabled;
        });
      }

      return headers;
    };
  }).filter('altthemesMatchCurrent', function () {
    return function (headers, current) {
      if (headers) {
        return headers.filter(function (value) {
          return !!value.keys.find(function (key) {
            return key === current;
          });
        });
      }

      return headers;
    };
  });
}
"use strict";

{
  angular.module('common.navigation', [])
  /**
   *
   * Override the original mars user.
   *
   */
  .directive('commonNavigation', [function () {
    return {
      restrict: 'AE',
      template: "<alt-themes current='current'></alt-themes>",
      scope: {
        current: "=?"
      },
      link: function link(scope) {
        scope.username = "Anonymous";

        if (!scope.current) {
          scope.current = "none";
        }
      }
    };
  }]).factory('navigationService', [function () {
    return {};
  }]);
}
"use strict";

(function (angular) {
  'use strict';

  angular.module("common.scroll", []).directive("commonScroller", ['$timeout', function ($timeout) {
    return {
      scope: {
        more: "&",
        buffer: "=?"
      },
      link: function link(scope, element, attrs) {
        var fetching;
        if (!scope.buffer) scope.buffer = 100;
        element.on("scroll", function (event) {
          var target = event.currentTarget;
          $timeout.cancel(fetching);
          fetching = $timeout(bouncer, 120);

          function bouncer() {
            if (scope.more && target.scrollHeight - target.scrollTop <= target.clientHeight + scope.buffer) {
              scope.more();
            }
          }
        });
      }
    };
  }]);
})(angular);
"use strict";

{
  angular.module("common.side-panel", []).factory('panelSideFactory', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    var state = {
      left: {
        active: null,
        width: 0
      },
      right: {
        active: null,
        width: 0
      }
    };

    function setSide(state, value) {
      var response = state.active;

      if (response === value) {
        state.active = null;
        state.width = 0;
      } else {
        state.active = value;
      }

      return !response;
    }

    return {
      state: state,
      setLeft: function setLeft(value) {
        var result = setSide(state.left, value);

        if (result) {
          state.left.width = 320; // We have a hard coded width at the moment we will probably refactor to parameterize it.
        }

        return result;
      },
      setRight: function setRight(data) {
        state.right.width = data.width;
        var response = setSide(state.right, data.name);
        $rootScope.$broadcast('side.panel.change', {
          side: "right",
          data: state.right,
          width: data.width
        });
        return response;
      }
    };
  }]).directive('sidePanelRightOppose', ["panelSideFactory", function (panelSideFactory) {
    return {
      restrict: 'E',
      transclude: true,
      template: '<div class="contentContainer" ng-attr-style="right:{{right.width}}">' + '<ng-transclude></ng-transclude>' + '</div>',
      link: function link(scope) {
        scope.right = panelSideFactory.state.right;
      }
    };
  }]).directive('sidePanelRight', ["panelSideFactory", function (panelSideFactory) {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'icsm/side-panel/side-panel-right.html',
      link: function link(scope) {
        scope.right = panelSideFactory.state.right;

        scope.closePanel = function () {
          panelSideFactory.setRight({
            name: null,
            width: 0
          });
        };
      }
    };
  }]).directive('panelTrigger', ["panelSideFactory", function (panelSideFactory) {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'common/side-panel/trigger.html',
      scope: {
        "default": "@?",
        panelWidth: "@",
        name: "@",
        iconClass: "@",
        panelId: "@"
      },
      link: function link(scope) {
        scope.toggle = function () {
          panelSideFactory.setRight({
            width: scope.panelWidth,
            name: scope.panelId
          });
        };

        if (scope["default"]) {
          panelSideFactory.setRight({
            width: scope.panelWidth,
            name: scope.panelId
          });
        }
      }
    };
  }]).directive('panelOpenOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
    return {
      restrict: 'E',
      scope: {
        panelWidth: "@",
        eventName: "@",
        panelId: "@",
        side: "@?"
      },
      link: function link(scope) {
        if (!scope.side) {
          scope.side = "right";
        }

        $rootScope.$on(scope.eventName, function (event, data) {
          var state = panelSideFactory.state[scope.side];

          if (state && (!state.active || scope.panelId !== state.active)) {
            var params = {
              width: scope.panelWidth,
              name: scope.panelId
            };

            if (scope.side === "right") {
              panelSideFactory.setRight(params);
            } else {
              panelSideFactory.setLeft(params);
            }
          }
        });
      }
    };
  }]).directive('panelCloseOnEvent', ["$rootScope", "panelSideFactory", function ($rootScope, panelSideFactory) {
    return {
      restrict: 'E',
      scope: {
        eventName: "@",
        side: "@?",
        onlyOn: "@?"
      },
      link: function link(scope) {
        if (!scope.side) {
          scope.side = "right";
        }

        $rootScope.$on(scope.eventName, function (event, data) {
          var state = panelSideFactory.state[scope.side];

          if (scope.onlyOn && state.active !== scope.onlyOn) {
            return;
          }

          if (state && state.active) {
            var params = {
              name: null
            };

            if (scope.side === "right") {
              panelSideFactory.setRight(params);
            } else {
              panelSideFactory.setLeft(params);
            }
          }
        });
      }
    };
  }]).directive('sidePanelLeft', ['panelSideFactory', function (panelSideFactory) {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: 'icsm/side-panel/side-panel-left.html',
      link: function link(scope) {
        scope.left = panelSideFactory.state.left;

        scope.closeLeft = function () {
          panelSideFactory.setLeft(null);
        };
      }
    };
  }]);
}
"use strict";

{
  angular.module('common.slider', []).directive('slider', ['$parse', '$timeout', function ($parse, $timeout) {
    return {
      restrict: 'AE',
      replace: true,
      template: '<div><input class="slider-input" type="text" /></div>',
      require: 'ngModel',
      scope: {
        max: "=",
        min: "=",
        step: "=",
        value: "=",
        ngModel: '=',
        range: '=',
        enabled: '=',
        sliderid: '=',
        formatter: '&',
        onStartSlide: '&',
        onStopSlide: '&',
        onSlide: '&'
      },
      link: function link($scope, element, attrs, ngModelCtrl, $compile) {
        var ngModelDeregisterFn, ngDisabledDeregisterFn;
        initSlider();

        function initSlider() {
          var options = {};

          function setOption(key, value, defaultValue) {
            options[key] = value || defaultValue;
          }

          function setFloatOption(key, value, defaultValue) {
            options[key] = value ? parseFloat(value) : defaultValue;
          }

          function setBooleanOption(key, value, defaultValue) {
            options[key] = value ? value + '' === 'true' : defaultValue;
          }

          function getArrayOrValue(value) {
            return angular.isString(value) && value.indexOf("[") === 0 ? angular.fromJson(value) : value;
          }

          setOption('id', $scope.sliderid);
          setOption('orientation', attrs.orientation, 'horizontal');
          setOption('selection', attrs.selection, 'before');
          setOption('handle', attrs.handle, 'round');
          setOption('tooltip', attrs.uiTooltip, 'show');
          setOption('tooltipseparator', attrs.tooltipseparator, ':');
          setFloatOption('min', $scope.min, 0);
          setFloatOption('max', $scope.max, 10);
          setFloatOption('step', $scope.step, 1);
          var strNbr = options.step + '';
          var decimals = strNbr.substring(strNbr.lastIndexOf('.') + 1);
          setFloatOption('precision', attrs.precision, decimals);
          setBooleanOption('tooltip_split', attrs.tooltipsplit, false);
          setBooleanOption('enabled', attrs.enabled, true);
          setBooleanOption('naturalarrowkeys', attrs.naturalarrowkeys, false);
          setBooleanOption('reversed', attrs.reversed, false);
          setBooleanOption('range', $scope.range, false);

          if (options.range) {
            if (angular.isArray($scope.value)) {
              options.value = $scope.value;
            } else if (angular.isString($scope.value)) {
              options.value = getArrayOrValue($scope.value);

              if (!angular.isArray(options.value)) {
                var value = parseFloat($scope.value);
                if (isNaN(value)) value = 5;

                if (value < $scope.min) {
                  value = $scope.min;
                  options.value = [value, options.max];
                } else if (value > $scope.max) {
                  value = $scope.max;
                  options.value = [options.min, value];
                } else {
                  options.value = [options.min, options.max];
                }
              }
            } else {
              options.value = [options.min, options.max]; // This is needed, because of value defined at $.fn.slider.defaults - default value 5 prevents creating range slider
            }

            $scope.ngModel = options.value; // needed, otherwise turns value into [null, ##]
          } else {
            setFloatOption('value', $scope.value, 5);
          }

          if ($scope.formatter) options.formatter = $scope.$eval($scope.formatter);
          var slider = $(element).find(".slider-input").eq(0); // check if slider jQuery plugin exists

          if ($.fn.slider) {
            // adding methods to jQuery slider plugin prototype
            $.fn.slider.constructor.prototype.disable = function () {
              this.picker.off();
            };

            $.fn.slider.constructor.prototype.enable = function () {
              this.picker.on();
            }; // destroy previous slider to reset all options


            slider.slider(options);
            slider.slider('destroy');
            slider.slider(options); // everything that needs slider element

            var updateEvent = getArrayOrValue(attrs.updateevent);

            if (angular.isString(updateEvent)) {
              // if only single event name in string
              updateEvent = [updateEvent];
            } else {
              // default to slide event
              updateEvent = ['slide'];
            }

            angular.forEach(updateEvent, function (sliderEvent) {
              slider.on(sliderEvent, function (ev) {
                ngModelCtrl.$setViewValue(ev.value);
                $timeout(function () {
                  $scope.$apply();
                });
              });
            });
            slider.on('change', function (ev) {
              ngModelCtrl.$setViewValue(ev.value.newValue);
              $timeout(function () {
                $scope.$apply();
              });
            }); // Event listeners

            var sliderEvents = {
              slideStart: 'onStartSlide',
              slide: 'onSlide',
              slideStop: 'onStopSlide'
            };
            angular.forEach(sliderEvents, function (sliderEventAttr, sliderEvent) {
              slider.on(sliderEvent, function (ev) {
                if ($scope[sliderEventAttr]) {
                  var invoker = $parse(attrs[sliderEventAttr]);
                  invoker($scope.$parent, {
                    $event: ev,
                    value: ev.value
                  });
                  $timeout(function () {
                    $scope.$apply();
                  });
                }
              });
            }); // deregister ngDisabled watcher to prevent memory leaks

            if (angular.isFunction(ngDisabledDeregisterFn)) {
              ngDisabledDeregisterFn();
              ngDisabledDeregisterFn = null;
            }

            if (angular.isDefined(attrs.ngDisabled)) {
              ngDisabledDeregisterFn = $scope.$watch(attrs.ngDisabled, function (value) {
                if (value) {
                  slider.slider('disable');
                } else {
                  slider.slider('enable');
                }
              });
            } // deregister ngModel watcher to prevent memory leaks


            if (angular.isFunction(ngModelDeregisterFn)) ngModelDeregisterFn();
            ngModelDeregisterFn = $scope.$watch('ngModel', function (value) {
              slider.slider('setValue', value);
            });
          }

          window.slip = slider;
          $scope.$watch("enabled", function (value) {
            if (value) {
              slider.slider('disable');
            } else {
              slider.slider('enable');
            }
          });
        }

        var watchers = ['min', 'max', 'step', 'range'];
        angular.forEach(watchers, function (prop) {
          $scope.$watch(prop, function () {
            initSlider();
          });
        });
      }
    };
  }]);
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// In the style of threejs loaders. Adapted from here
// https://github.com/Tomella/elevation/blob/master/source/geotiff/terrainloader.ts
var TerrainLoader = /*#__PURE__*/function () {
  function TerrainLoader() {
    _classCallCheck(this, TerrainLoader);
  }

  _createClass(TerrainLoader, [{
    key: "load",
    value: function load(url, onload, onerror) {
      var request = new XMLHttpRequest();
      request.addEventListener('load', function (event) {
        try {
          var parser = new GeotiffParser();
          parser.parseHeader(event.target.response);
          onload(parser.loadPixels());
        } catch (error) {
          onerror(error);
        }
      }, false);

      if (onerror !== undefined) {
        request.addEventListener('error', function (event) {
          onerror(event);
        }, false);
      }

      request.open('GET', url, true);
      request.responseType = 'arraybuffer';
      request.send(null);
    }
  }]);

  return TerrainLoader;
}();
"use strict";

{
  angular.module("common.storage", ['explorer.projects']).factory("storageService", ['$log', '$q', 'projectsService', function ($log, $q, projectsService) {
    return {
      setGlobalItem: function setGlobalItem(key, value) {
        this._setItem("_system", key, value);
      },
      setItem: function setItem(key, value) {
        projectsService.getCurrentProject().then(function (project) {
          this._setItem(project, key, value);
        }.bind(this));
      },
      _setItem: function _setItem(project, key, value) {
        $log.debug("Fetching state for key locally" + key);
        localStorage.setItem("mars.anon." + project + "." + key, JSON.stringify(value));
      },
      getGlobalItem: function getGlobalItem(key) {
        return this._getItem("_system", key);
      },
      getItem: function getItem(key) {
        var deferred = $q.defer();
        projectsService.getCurrentProject().then(function (project) {
          this._getItem(project, key).then(function (response) {
            deferred.resolve(response);
          });
        }.bind(this));
        return deferred.promise;
      },
      _getItem: function _getItem(project, key) {
        $log.debug("Fetching state locally for key " + key);
        var item = localStorage.getItem("mars.anon." + project + "." + key);

        if (item) {
          try {
            item = JSON.parse(item);
          } catch (e) {// Do nothing as it will be a string
          }
        }

        return $q.when(item);
      }
    };
  }]);
}
angular.module('common.templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('common/cc/cc.html','<button type="button" class="undecorated" title="View CCBy {{details.version}} licence details"\r\n      popover-trigger="outsideClick"\r\n      uib-popover-template="template" popover-placement="bottom" popover-append-to-body="true">\r\n\t<i ng-class="{active:data.isWmsShowing}" class="fa fa-lg fa-gavel"></i>\r\n</button>');
$templateCache.put('common/cc/cctemplate.html','<div>\r\n   <div class="row">\r\n      <div class="col-md-12">\r\n         <a target="_blank" ng-href="{{details.link}}">Creative Commons Attribution {{details.version}} </a>\r\n      </div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-2">\r\n         <span class="fa-stack" aria-hidden="true">\r\n         <i class="fa fa-check-circle-o fa-stack-2x" aria-hidden="true"></i>\r\n      </span>\r\n      </div>\r\n      <div class="col-md-10">\r\n         You may use this work for commercial purposes.\r\n      </div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-2">\r\n         <span class="fa-stack" aria-hidden="true">\r\n         <i class="fa fa-circle-o fa-stack-2x"></i>\r\n         <i class="fa fa-female fa-stack-1x"></i>\r\n      </span>\r\n      </div>\r\n      <div class="col-md-10">\r\n         You must attribute the creator in your own works.\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('common/featureinf/featureinf.html','<div class="fi-d1" drag-parent parentclass="featureInfContainer" ng-class="d1Height">\n    <button class="undecorated fi-close" ng-click="close()">X</button>\n    <div class="fi-d2">\n      <div class="fi-d3">\n        <div class="fi-d3-1">\n            <strong style="font-size: 120%;padding:2px;">Features</strong>\n        </div>\n        <div class="fi-d3-2">\n          <div class="fi-d4">\n            <div class="fi-d5">\n                <div style="padding:5px;" ng-repeat="feature in features" ng-mouseenter="entered(feature)" ng-mouseleave="left()">\n                    <div ng-if="feature.properties.maptitle" style="white-space: nowrap;">\n                        <strong>Map Title:</strong>\n                        <span title=\'{{feature.properties.mapnumber ? "Map number: " + feature.properties.mapnumber : ""}}\'>\n                            {{feature.properties.maptitle}}\n                        </span>\n                    </div>\n    \n                    <div ng-if="feature.properties.project">\n                        <strong>Project Name:</strong>\n                        {{feature.properties.project}}\n                    </div>\n    \n                    <div ng-if="feature.properties.captured">\n                        <strong>Capture Date:</strong>{{captured(feature.properties.captured)}}\n                    </div>\n    \n                    <div\n                        ng-if="feature.properties.object_name || feature.properties.object_name_ahd || feature.properties.object_name_ort">\n                        <strong>File Name:</strong>\n                        {{feature.properties.object_name}}{{feature.properties.object_name_ahd}}{{feature.properties.object_name_ort}}\n                    </div>\n    \n                    <div>\n                        <strong>Status:</strong>\n                        {{feature.properties.status}}\n                    </div>\n    \n                    <div ng-if="feature.properties.available_date">\n                        <strong>Available Date:</strong>\n                        {{formatDate(feature.properties.available_date)}}\n                    </div>\n    \n                    <div ng-if="feature.properties.contact">\n                        <strong>Contact:</strong> <a\n                            href=\'{{feature.properties.contact}}\'>{{feature.properties.contact}}</a>\n                    </div>\n    \n                    <div ng-if="feature.properties.metadata_url">\n                        <a href=\'{{feature.properties.metadata_url}}\' target=\'_blank\'>Metadata</a>\n                    </div>\n                    <hr ng-if="!$last" style="margin:5px"/>\n                </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>');
$templateCache.put('common/header/header.html','<div class="container-full common-header" style="padding-right:10px; padding-left:10px">\r\n   <div class="navbar-header">\r\n\r\n      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".ga-header-collapse">\r\n         <span class="sr-only">Toggle navigation</span>\r\n         <span class="icon-bar"></span>\r\n         <span class="icon-bar"></span>\r\n         <span class="icon-bar"></span>\r\n      </button>\r\n\r\n      <a href="/" class="appTitle visible-xs">\r\n         <h1 style="font-size:120%">{{heading}}</h1>\r\n      </a>\r\n   </div>\r\n   <div class="navbar-collapse collapse ga-header-collapse">\r\n      <ul class="nav navbar-nav">\r\n         <li class="hidden-xs">\r\n            <a href="https://www.icsm.gov.au/" target="_blank" class="icsm-logo"\r\n               style="margin-top: -4px;display:inline-block;">\r\n               <img alt="ICSM - ANZLIC Committee on Surveying &amp; Mapping" class="header-logo"\r\n                  src="icsm/resources/img/icsm-logo-sml.gif">\r\n            </a>\r\n            <a href="/" style="margin-top:8px; padding:5px;display:inline-block">\r\n               <h1 class="applicationTitle">{{heading}}</h1>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class="nav navbar-nav navbar-right nav-icons">\r\n         <li common-navigation role="menuitem" current="current" style="padding-right:10px"></li>\r\n         <li mars-version-display role="menuitem"></li>\r\n         <li style="width:10px"></li>\r\n      </ul>\r\n   </div>\r\n   <!--/.nav-collapse -->\r\n</div>\r\n<div class="contributorsLink" style="position: absolute; right:7px; bottom:15px">\r\n   <icsm-contributors-link></icsm-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class="row">\r\n   <div class="col-md-12">\r\n      <div class="strap-blue">\r\n      </div>\r\n      <div class="strap-white">\r\n      </div>\r\n      <div class="strap-red">\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('common/reset/reset.html','<button type="button" class="map-tool-toggle-btn" ng-click="reset()" title="Reset page">\r\n   <span class="panel-sm">Reset</span>\r\n   <i class="fa fa-lg fa-refresh"></i>\r\n</button>');
$templateCache.put('common/navigation/altthemes.html','<span class="altthemes-container">\r\n\t<span ng-repeat="item in themes | altthemesEnabled">\r\n       <a title="{{item.label}}" ng-href="{{item.url}}" class="altthemesItemCompact" target="_blank">\r\n         <span class="altthemes-icon" ng-class="item.className"></span>\r\n       </a>\r\n    </li>\r\n</span>');
$templateCache.put('common/side-panel/trigger.html','<button ng-click="toggle()" type="button" class="map-tool-toggle-btn">\r\n   <span class="panel-sm">{{name}}</span>\r\n   <ng-transclude></ng-transclude>\r\n   <i class="fa fa-lg" ng-class="iconClass"></i>\r\n</button>');}]);