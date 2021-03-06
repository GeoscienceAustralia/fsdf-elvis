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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

{
  var RootCtrl = function RootCtrl($http, configService, mapService) {
    var _this = this;

    _classCallCheck(this, RootCtrl);

    mapService.getMap().then(function (map) {
      _this.map = map;
    });
    configService.getConfig().then(function (data) {
      _this.data = data; // If its got WebGL its got everything we need.

      try {
        var canvas = document.createElement('canvas');
        data.modern = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        data.modern = false;
      }
    });
  };

  RootCtrl.$invoke = ['$http', 'configService', 'mapService'];
  angular.module("IcsmApp", ['common.altthemes', 'common.baselayer.control', 'common.cc', 'common.featureinf', 'common.header', 'common.legend', 'common.navigation', 'common.reset', "common.side-panel", 'common.slider', 'common.storage', 'common.templates', 'elvis.results', 'elvis.reviewing', 'explorer.config', 'explorer.confirm', 'explorer.drag', 'explorer.enter', 'explorer.flasher', 'explorer.httpdata', 'explorer.info', 'explorer.legend', 'explorer.message', 'explorer.modal', 'explorer.persist', 'explorer.projects', 'explorer.tabs', 'explorer.version', 'exp.ui.templates', 'explorer.map.templates', //'geo.draw',
  // 'geo.elevation',
  'temp.elevation', // Filling in until new service is developed
  'geo.geosearch', 'geo.map', 'geo.maphelper', 'geo.measure', 'icsm.bounds', 'icsm.clip', 'icsm.contributors', 'icsm.coverage', 'icsm.elevation.point', 'icsm.glossary', 'icsm.header', 'icsm.help', 'icsm.imagery', 'icsm.layerswitch', 'icsm.mapevents', 'icsm.panes', "icsm.parameters", "icsm.polygon", 'icsm.point', 'icsm.products', 'icsm.preview', 'icsm.select', 'icsm.splash', 'icsm.templates', 'icsm.toolbar', 'icsm.view', 'ngAutocomplete', 'ngRoute', 'ngSanitize', 'page.footer', 'placenames.search', 'placenames.config', 'placenames.summary', 'ui.bootstrap', 'vcRecaptcha']) // Set up all the service providers here.
  .config(['$locationProvider', 'configServiceProvider', 'placenamesConfigServiceProvider', 'projectsServiceProvider', 'persistServiceProvider', 'versionServiceProvider', function ($locationProvider, configServiceProvider, placenamesConfigServiceProvider, projectsServiceProvider, persistServiceProvider, versionServiceProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
    configServiceProvider.location("icsm/resources/config/config.json?v=b");
    placenamesConfigServiceProvider.location("icsm/resources/config/placenames.json"); //configServiceProvider.dynamicLocation("icsm/resources/config/appConfig.json?t=");

    versionServiceProvider.url("icsm/assets/package.json");
    projectsServiceProvider.setProject("icsm");
    persistServiceProvider.handler("local");
  }]).factory("userService", [function () {
    return {
      login: noop,
      hasAcceptedTerms: noop,
      setAcceptedTerms: noop,
      getUsername: function getUsername() {
        return "anon";
      }
    };

    function noop() {
      return true;
    }
  }]).controller("RootCtrl", RootCtrl);
}
"use strict";

{
  var fileSize = function fileSize(size) {
    var meg = 1000 * 1000;
    var gig = meg * 1000;
    var ter = gig * 1000;

    if (!size) {
      return "-";
    }

    if (("" + size).indexOf(" ") > -1) {
      return size;
    }

    size = parseFloat(size);

    if (size < 1000) {
      return size + " bytes";
    }

    if (size < meg) {
      return (size / 1000).toFixed(1) + " kB";
    }

    if (size < gig) {
      return (size / meg).toFixed(1) + " MB";
    }

    if (size < ter) {
      return (size / gig).toFixed(1) + " GB";
    }

    return (size / ter).toFixed(1) + " TB";
  };

  angular.module("icsm.bounds", ["icsm.message"]).directive('icsmBounds', ['$rootScope', 'icsmMessageService', 'boundsService', function ($rootScope, icsmMessageService, boundsService) {
    return {
      restrict: 'AE',
      link: function link() {
        boundsService.init().then(null, null, function notify(message) {
          icsmMessageService.removeFlash();

          switch (message.type) {
            case "error":
            case "warn":
            case "info":
              icsmMessageService[message.type](message.text);
              break;

            case "wait":
              icsmMessageService.wait(message.text);
              break;

            default:
              icsmMessageService.flash(message.text, message.duration ? message.duration : 8000, message.type === "wait");
          }
        });
      }
    };
  }]).factory("boundsService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService', 'messageService', "parametersService", function ($http, $q, $rootScope, $timeout, configService, flashService, messageService, parametersService) {
    var clipTimeout, notify;
    return {
      init: function init() {
        var notify = $q.defer();

        if (parametersService.hasValidBbox()) {
          send('Checking for data (' + parametersService.metadata + ')...');
          getList(parametersService.clip);
        }

        $rootScope.$on('icsm.clip.drawn', function (event, clip) {
          send('Area drawn. Checking for data...');

          _checkSize(clip).then(function (message) {
            if (message.code === "success") {
              getList(clip);
            }
          });
        });
        return notify.promise;
      },
      cancelDraw: function cancelDraw() {
        drawService.cancelDraw();
      },
      checkSize: function checkSize(clip) {
        return _checkSize(clip);
      }
    };

    function send(message, type, duration) {
      flashService.remove(notify);

      if (message) {
        if (type === "error") {
          messageService.error(message);
        } else {
          notify = flashService.add(message, duration, true);
        }
      }
    }

    function _checkSize(clip) {
      return $q(function (resolve) {
        var result = drawn(clip);

        if (result && result.code) {
          switch (result.code) {
            case "oversize":
              $timeout(function () {
                send("", "clear");
                send("The selected area is too large to process. Please restrict to approximately " + "1.5 degrees square.", "error");
              });
              break;

            case "undersize":
              $timeout(function () {
                send("", "clear");
                send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " + "Please update the drawn area.", "error");
              });
          }

          resolve(result);
        }
      });
    }

    function underSizeLimit(clip) {
      var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
      return size < 0.00000000001 || clip.xMax < clip.xMin;
    }

    function overSizeLimit(clip) {
      // Shouldn't need abs but it doesn't hurt.
      var size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
      return size > 2.25;
    }

    function forceNumbers(clip) {
      clip.xMax = clip.xMax === null ? null : +clip.xMax;
      clip.xMin = clip.xMin === null ? null : +clip.xMin;
      clip.yMax = clip.yMax === null ? null : +clip.yMax;
      clip.yMin = clip.yMin === null ? null : +clip.yMin;
    }

    function drawn(clip) {
      //geoprocessService.removeClip();
      forceNumbers(clip);

      if (overSizeLimit(clip)) {
        return {
          code: "oversize"
        };
      }

      if (underSizeLimit(clip)) {
        return {
          code: "undersize"
        };
      }

      if (clip.xMax === null) {
        return {
          code: "incomplete"
        };
      }

      if (validClip(clip)) {
        return {
          code: "success"
        };
      }

      return {
        code: "invalid"
      };
    } // The input validator takes care of order and min/max constraints. We just check valid existance.


    function validClip(clip) {
      return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip) && !underSizeLimit(clip);
    }

    function getList(clip) {
      configService.getConfig("processing").then(function (conf) {
        var url = conf.intersectsUrl;

        if (url) {
          var xMax = clip.xMax.toFixed(5),
              xMin = clip.xMin.toFixed(5),
              yMax = clip.yMax.toFixed(5),
              yMin = clip.yMin.toFixed(5),
              params = ["polygon=" + encodeURIComponent(clip.polygon)];

          if (clip.metadata) {
            params.push("metadata=" + clip.metadata);
          }

          send("Checking there is data in your selected area...", "wait", 180000);
          $http.get(url + params.join("&")).then(function (response) {
            if (response.data && response.data.available_data) {
              var hasData = false;
              send("", "clear");

              if (response.data.available_data) {
                response.data.available_data.forEach(function (group) {
                  if (group.downloadables) {
                    decorateDownloadables(group.downloadables);
                    hasData = true;
                  }
                });
              }

              if (!hasData) {
                send("There is no data held in your selected area. Please try another area.", null, 4000);
              }

              $rootScope.$broadcast('site.selection', response.data);
            }
          }, function (err) {
            // If it falls over we don't want to crash.
            send("The service that provides the list of datasets is currently unavailable. " + "Please try again later.", "error");
          });
        }
      });

      function decorateDownloadables(downloadables) {
        Object.keys(downloadables).forEach(function (groupname) {
          var group = downloadables[groupname];
          Object.keys(group).forEach(function (listName) {
            var items = group[listName];
            items.forEach(function (item) {
              return decorateItem(item);
            });
          });
        });
      }

      function decorateItem(item) {
        item.fileSize = fileSize(item.file_size);

        if (item.product) {
          //  "bbox" : "113,-44,154,-10"
          var arr = item.bbox.split(",").map(function (num) {
            return +num;
          });
          item.bbox = [Math.max(arr[0], clip.xMin), Math.max(arr[1], clip.yMin), Math.min(arr[2], clip.xMax), Math.min(arr[3], clip.yMax)].join(",");
        }
      }
    }
  }]);
}
"use strict";

{
  var CoverageService = function CoverageService(configService, mapService) {
    var state = {
      show: false
    };
    return {
      getState: function getState() {
        return state;
      },
      toggle: function toggle() {
        state.show = !state.show;

        if (!state.layers) {
          configService.getConfig("map").then(function (config) {
            state.layers = config.layers.filter(function (element) {
              return element.coverage;
            });
            mapService.getMap().then(function (map) {
              state.map = map;
              state.lookup = state.layers.reduce(function (acc, element) {
                acc[element.name] = element;
                element.visible = map.hasLayer(element.layer);
                return acc;
              }, {});
            });
          });
        }
      },
      toggleVisibility: function toggleVisibility(element) {
        element.visible = !element.visible;

        if (element.visible) {
          if (element.layer) {
            state.map.addLayer(element.layer);
          } else {
            mapService.addLayer(element);
          }
        } else {
          element.layer.remove();
        }
      },
      hide: function hide() {
        state.show = false;
      }
    };
  };

  angular.module("icsm.coverage", []).directive("coverageToggle", ["coverageService", function (coverageService) {
    return {
      templateUrl: "icsm/coverage/trigger.html",
      restrict: "AE",
      link: function link(scope) {
        scope.toggle = function () {
          coverageService.toggle();
        };
      }
    };
  }]).directive("icsmCoverageLayersSelector", ["$document", "$timeout", "coverageService", function ($document, $timeout, coverageService) {
    return {
      templateUrl: "icsm/coverage/popup.html",
      scope: {},
      link: function link(scope, element) {
        function keyupHandler(keyEvent) {
          if (keyEvent.which === 27) {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
            scope.$apply(function () {
              coverageService.hide();
            });
          }
        }

        scope.state = coverageService.getState();
        scope.$watch("state.show", function (newValue) {
          if (newValue) {
            $document.on('keyup', keyupHandler);
            $timeout(function () {
              return element.find("button").focus();
            }, 50);
          } else {
            $document.off('keyup', keyupHandler);
          }

          scope.$on('$destroy', function () {
            $document.off('keyup', keyupHandler);
          });
        });

        scope.hide = function () {
          coverageService.hide();
        };

        scope.toggleVisibility = function (layer) {
          coverageService.toggleVisibility(layer);
        };
      }
    };
  }]).factory("coverageService", CoverageService);
  CoverageService.$inject = ["configService", "mapService"];
}
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

{
  angular.module("icsm.clip", ['geo.draw', 'explorer.clip.modal']).directive('icsmInfoBbox', function () {
    return {
      restrict: 'AE',
      templateUrl: 'icsm/clip/infobbox.html'
    };
  }).directive("icsmClip", ['$rootScope', '$timeout', 'clipService', 'messageService', 'mapService', function ($rootScope, $timeout, clipService, messageService, mapService) {
    return {
      templateUrl: "icsm/clip/clip.html",
      scope: {
        bounds: "=",
        trigger: "=",
        drawn: "&"
      },
      link: function link(scope, element) {
        var timer;
        scope.clip = clipService.data.clip;
        scope.typing = false;

        if (typeof scope.showBounds === "undefined") {
          scope.showBounds = false;
        }

        mapService.getMap().then(function (map) {
          scope.$watch("bounds", function (bounds) {
            if (bounds && scope.trigger) {
              $timeout(function () {
                scope.initiateDraw();
              });
            } else if (!bounds) {
              clipService.cancelDraw();
            }
          });
        });
        $rootScope.$on('icsm.clip.draw', function (event, data) {
          if (data && data.message === "oversize") {
            scope.oversize = true;
            $timeout(function () {
              delete scope.oversize;
            }, 6000);
          } else {
            delete scope.oversize;
          }
        }); // Hide the manual drawing

        $rootScope.$on('icsm.clip.drawn', function () {
          return scope.typing = false;
        });

        scope.initiateDraw = function () {
          messageService.info("Click on the map and drag to define your area of interest.");
          clipService.initiateDraw();
        };

        scope.initiatePolygon = function () {
          messageService.info("Click on map for each vertex. Click on the first vertex to close the polygon.", 6);
          clipService.initiatePolygon();
        };
      }
    };
  }]).directive('icsmManualClip', ["$rootScope", "clipService", function ($rootScope) {
    return {
      restrict: 'AE',
      templateUrl: 'icsm/clip/manual.html',
      scope: {},
      link: function link(scope) {
        // yMax, yMin, xMax,xMin
        $rootScope.$on('icsm.polygon.drawn', function (event, c) {
          return setClip(c);
        });
        $rootScope.$on('icsm.clip.drawn', function (event, c) {
          return setClip(c);
        });

        function setClip(c) {
          scope.xMin = c.xMin;
          scope.yMin = c.yMin;
          scope.xMax = c.xMax;
          scope.yMax = c.yMax;
        }

        scope.allowSearch = function () {
          return !isNan(scope.xMin) && !isNan(scope.xMax) && !isNan(scope.yMin) && !isNan(scope.yMax) && +scope.xMin !== +scope.xMax && +scope.yMin !== +scope.yMax;
        };

        scope.search = function () {
          // Normalise coordinates
          var min = scope.xMin;
          var max = scope.xMax;
          scope.xMin = Math.min(min, max);
          scope.xMax = Math.max(min, max);
          min = scope.yMin;
          max = scope.yMax;
          scope.yMin = Math.min(min, max);
          scope.yMax = Math.max(min, max);
          $rootScope.$broadcast("bounds.drawn", {
            bounds: L.latLngBounds(L.latLng(+scope.yMin, +scope.xMin), L.latLng(+scope.yMax, +scope.xMax))
          });
        };
      }
    };
  }]).factory("clipService", ['$rootScope', 'drawService', 'parametersService', function ($rootScope, drawService, parametersService) {
    var options = {
      maxAreaDegrees: 4
    },
        service = {
      data: {
        clip: {}
      },
      initiateDraw: function initiateDraw() {
        this.cancelDraw();
        $rootScope.$broadcast("clip.initiate.draw", {
          started: true
        });
        var clip = this.data.clip;
        delete clip.xMin;
        delete clip.xMax;
        delete clip.yMin;
        delete clip.yMax;
        delete clip.area;
        delete clip.type;
        delete clip.polygon;
        return drawService.drawRectangle({
          retryOnOversize: false
        });
      },
      initiatePolygon: function initiatePolygon() {
        this.cancelDraw();
        $rootScope.$broadcast("clip.initiate.draw", {
          started: true
        });
        var clip = this.data.clip;
        delete clip.xMin;
        delete clip.xMax;
        delete clip.yMin;
        delete clip.yMax;
        delete clip.area;
        delete clip.type;
        delete clip.polygon;
        return drawService.drawPolygon({
          retryOnOversize: false
        });
      },
      cancelDraw: function cancelDraw() {
        drawService.cancelDraw();
      },
      setClip: function setClip(data) {
        return drawComplete(data);
      }
    };
    $rootScope.$on("bounds.drawn", function (event, data) {
      broadcaster(data); // Let people know it is drawn
    });
    $rootScope.$on("polygon.drawn", function (event, data) {
      $rootScope.$broadcast('icsm.poly.draw', data[0]); // Let people know it is drawn

      var clip = service.data.clip;
      var polyData = data[0];
      clip.type = "polygon";
      clip.xMax = Math.max.apply(Math, _toConsumableArray(polyData.map(function (element) {
        return element.lng;
      })));
      clip.xMin = Math.min.apply(Math, _toConsumableArray(polyData.map(function (element) {
        return element.lng;
      })));
      clip.yMax = Math.max.apply(Math, _toConsumableArray(polyData.map(function (element) {
        return element.lat;
      })));
      clip.yMin = Math.min.apply(Math, _toConsumableArray(polyData.map(function (element) {
        return element.lat;
      })));
      clip.polygon = "POLYGON((" + [].concat(_toConsumableArray(polyData), [polyData[0]]).map(function (item) {
        return item.lng.toFixed(5) + " " + item.lat.toFixed(5);
      }).join(",") + "))";
      $rootScope.$broadcast('icsm.polygon.drawn', clip);
    });
    var data = parametersService.data;

    if (data) {
      broadcaster(data, true);
      service.data.clip.type = "bbox";
    }

    return service;

    function broadcaster(data, zoom) {
      console.log("data", data);
      service.setClip(data);
      var c = service.data.clip;
      $rootScope.$broadcast('icsm.bounds.draw', [c.xMin, c.yMin, c.xMax, c.yMax, !!zoom]); // Draw it

      $rootScope.$broadcast('icsm.clip.drawn', c); // Let people know it is drawn
    }

    function drawComplete(data) {
      var clip = service.data.clip;
      clip.xMax = data.bounds.getEast().toFixed(5);
      clip.xMin = data.bounds.getWest().toFixed(5);
      clip.yMax = data.bounds.getNorth().toFixed(5);
      clip.yMin = data.bounds.getSouth().toFixed(5);
      clip.type = "bbox";
      clip.polygon = "POLYGON((" + clip.xMin + " " + clip.yMin + "," + clip.xMin + " " + clip.yMax + "," + clip.xMax + " " + clip.yMax + "," + clip.xMax + " " + clip.yMin + "," + clip.xMin + " " + clip.yMin + "))";
      service.data.area = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
      return service.data;
    }
  }]);
}
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */
{
  angular.module("explorer.clip.modal", []).directive("clipModal", ['$document', '$animate', function ($document, $animate) {
    return {
      restrict: 'EA',
      transclude: true,
      replace: true,
      scope: {
        title: '@',
        isOpen: '=',
        showClose: "="
      },
      templateUrl: 'icsm/clip/modal.html',
      link: function link(scope, element) {
        function keyupHandler(keyEvent) {
          if (keyEvent.which === 27) {
            keyEvent.stopPropagation();
            keyEvent.preventDefault();
            scope.$apply(function () {
              scope.isOpen = false;
            });
          }
        }

        scope.$watch("isOpen", function (newValue) {
          if (newValue) {
            $document.on('keyup', keyupHandler);
          } else {
            $document.off('keyup', keyupHandler);
          }

          scope.$on('$destroy', function () {
            $document.off('keyup', keyupHandler);
          });
        });
      }
    };
  }]);
}
"use strict";

{
  var ContributorsService = function ContributorsService($http) {
    var state = {
      show: false,
      ingroup: false,
      stick: false
    };
    $http.get("icsm/resources/config/contributors.json").then(function (response) {
      state.orgs = response.data;
    });
    return {
      getState: function getState() {
        return state;
      }
    };
  };

  angular.module('icsm.contributors', []).directive("icsmContributors", ["$interval", "contributorsService", function ($interval, contributorsService) {
    return {
      templateUrl: "icsm/contributors/contributors.html",
      scope: {},
      link: function link(scope, element) {
        var timer;
        scope.contributors = contributorsService.getState();

        scope.over = function () {
          $interval.cancel(timer);
          scope.contributors.ingroup = true;
        };

        scope.out = function () {
          timer = $interval(function () {
            scope.contributors.ingroup = false;
          }, 1000);
        };

        scope.unstick = function () {
          scope.contributors.ingroup = scope.contributors.show = scope.contributors.stick = false;
          element.find("a").blur();
        };
      }
    };
  }]).directive("icsmContributorsLink", ["$interval", "contributorsService", function ($interval, contributorsService) {
    return {
      restrict: "AE",
      templateUrl: "icsm/contributors/show.html",
      scope: {},
      link: function link(scope) {
        var timer;
        scope.contributors = contributorsService.getState();

        scope.over = function () {
          $interval.cancel(timer);
          scope.contributors.show = true;
        };

        scope.toggleStick = function () {
          scope.contributors.stick = !scope.contributors.stick;

          if (!scope.contributors.stick) {
            scope.contributors.show = scope.contributors.ingroup = false;
          }
        };

        scope.out = function () {
          timer = $interval(function () {
            scope.contributors.show = false;
          }, 700);
        };
      }
    };
  }]).factory("contributorsService", ContributorsService).filter("activeContributors", function () {
    return function (contributors) {
      if (!contributors) {
        return [];
      }

      return contributors.filter(function (contributor) {
        return contributor.enabled;
      });
    };
  });
  ContributorsService.$inject = ["$http"];
}
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

{
  angular.module("icsm.elevation.point", []).factory("elevationPointsService", ['$http', '$q', 'configService', function ($http, $q, configService) {
    var service = {
      getElevation: function getElevation(latlng) {
        return $q(function (resolve, reject) {
          configService.getConfig("elevation").then(function (config) {
            var delta = 0.000001;

            var _latlng = _slicedToArray(latlng, 2),
                lat = _latlng[0],
                lng = _latlng[1];

            var bbox = [lng - delta, lat - delta, lng + delta, lat + delta];
            var url = config.elevationTemplate.replace("{bbox}", bbox.join(","));
            new TerrainLoader().load(url, function (elev) {
              resolve(elev);
            }, function (e) {
              reject(e);
            });
          });
        });
      },
      getHiResElevation: function getHiResElevation(latlng) {
        return configService.getConfig("elevation").then(function (config) {
          return $http({
            method: 'GET',
            url: config.hiResElevationTemplate.replace("{lng}", latlng.lng).replace("{lat}", latlng.lat)
          });
        });
      }
    };
    return service;
  }]);
}
"use strict";

{
  var GlossaryCtrl = function GlossaryCtrl($log, glossaryService) {
    var _this = this;

    $log.info("GlossaryCtrl");
    glossaryService.getTerms().then(function (terms) {
      _this.terms = terms;
    });
  };

  var GlossaryService = function GlossaryService($http) {
    var TERMS_SERVICE = "icsm/resources/config/glossary.json";
    return {
      getTerms: function getTerms() {
        return $http.get(TERMS_SERVICE, {
          cache: true
        }).then(function (response) {
          return response.data;
        });
      }
    };
  };

  angular.module("icsm.glossary", []).directive("icsmGlossary", [function () {
    return {
      templateUrl: "icsm/glossary/glossary.html"
    };
  }]).controller("GlossaryCtrl", GlossaryCtrl).factory("glossaryService", GlossaryService);
  GlossaryCtrl.$inject = ['$log', 'glossaryService'];
  GlossaryService.$inject = ['$http'];
}
"use strict";

{
  angular.module('icsm.header', []).controller('headerController', ['$scope', '$q', '$timeout', function ($scope, $q, $timeout) {
    var modifyConfigSource = function modifyConfigSource(headerConfig) {
      return headerConfig;
    };

    $scope.$on('headerUpdated', function (event, args) {
      $scope.headerConfig = modifyConfigSource(args);
    });
  }]).directive('elvisHeader', [function () {
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
      templateUrl: "icsm/header/header.html",
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
}
"use strict";

{
  var HelpCtrl = function HelpCtrl($log, helpService) {
    var self = this;
    $log.info("HelpCtrl");
    helpService.getFaqs().then(function (faqs) {
      self.faqs = faqs;
    });
  };

  var HelpService = function HelpService($http) {
    var FAQS_SERVICE = "icsm/resources/config/faqs.json";
    return {
      getFaqs: function getFaqs() {
        return $http.get(FAQS_SERVICE, {
          cache: true
        }).then(function (response) {
          return response.data;
        });
      }
    };
  };

  angular.module("icsm.help", []).directive("icsmHelp", [function () {
    return {
      templateUrl: "icsm/help/help.html"
    };
  }]).directive("icsmFaqs", [function () {
    return {
      restrict: "AE",
      templateUrl: "icsm/help/faqs.html",
      scope: {
        faqs: "="
      },
      link: function link(scope) {
        scope.focus = function (key) {
          $("#faqs_" + key).focus();
        };
      }
    };
  }]).controller("HelpCtrl", HelpCtrl).factory("helpService", HelpService);
  HelpCtrl.$inject = ['$log', 'helpService'];
  HelpService.$inject = ['$http'];
}
"use strict";

{
  var showButton = function showButton(data) {
    return data.file_url && data.file_url.lastIndexOf(".zip") > 0; // Well it needs something in front of ".zip";
  };

  angular.module("icsm.imagery", []).directive("launchImage", ["$rootScope", "configService", function ($rootScope, configService) {
    return {
      templateUrl: "icsm/imagery/launch.html",
      restrict: "AE",
      link: function link(scope) {
        var item = scope.item;
        scope.show = showButton(item);

        scope.preview = function () {
          configService.getConfig("imagery").then(function (config) {
            var url = item.thumb_url;
            console.log(url, item);
            $rootScope.$broadcast("icsm-preview", {
              url: url,
              item: item
            });
          });
        };
      }
    };
  }]);
}
"use strict";

{
  var insidePolygon = function insidePolygon(latlng, polyPoints) {
    var x = latlng.lat,
        y = latlng.lng;
    var inside = false;

    for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
      var xi = polyPoints[i].lat,
          yi = polyPoints[i].lng;
      var xj = polyPoints[j].lat,
          yj = polyPoints[j].lng;
      var intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  };

  angular.module("icsm.layerswitch", []).directive('icsmLayerswitch', ['$http', 'configService', 'mapService', function ($http, configService, mapService) {
    return {
      restrict: "AE",
      link: function link(scope) {
        var config;
        var latlngs;
        configService.getConfig("layerSwitch").then(function (response) {
          config = response;
          $http.get(config.extentUrl, {
            cache: true
          }).then(function (response) {
            var container = L.geoJson(response.data);
            var layer = container.getLayers()[0];

            if (layer) {
              latlngs = layer.getLatLngs();
            }

            mapService.getMap().then(function (map) {
              map.on("moveend", checkExtent);
              checkExtent();

              function checkExtent(event) {
                var bounds = map.getBounds();

                if (insidePolygon({
                  lng: bounds.getWest(),
                  lat: bounds.getSouth()
                }, latlngs) && // ll
                insidePolygon({
                  lng: bounds.getWest(),
                  lat: bounds.getNorth()
                }, latlngs) && // ul
                insidePolygon({
                  lng: bounds.getEast(),
                  lat: bounds.getSouth()
                }, latlngs) && // lr
                insidePolygon({
                  lng: bounds.getEast(),
                  lat: bounds.getNorth()
                }, latlngs) // ur
                ) {
                    inSpace();
                  } else {
                  outOfSpace();
                }
              }

              function outOfSpace() {
                setLayers({
                  outside: true,
                  inside: false
                });
              }

              function inSpace() {
                setLayers({
                  outside: false,
                  inside: true
                });
              }

              function setLayers(settings) {
                map.eachLayer(function (layer) {
                  if (layer.options && layer.options["switch"]) {
                    if (layer.options["switch"] === config.inside) {
                      layer._container.style.display = settings.inside ? "block" : "none";
                    }

                    if (layer.options["switch"] === config.outside) {
                      layer._container.style.display = settings.outside ? "block" : "none";
                    }
                  }
                });
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
  angular.module("icsm.mapevents", ['geo.map']).directive('icsmMapevents', ['icsmMapeventsService', function (icsmMapeventsService) {
    return {
      restrict: 'AE',
      link: function link(scope) {
        icsmMapeventsService.tickle();
      }
    };
  }]).factory('icsmMapeventsService', ['$rootScope', '$timeout', 'configService', 'mapService', function ($rootScope, $timeout, configService, mapService) {
    var marker, poly, bbox;
    var config = configService.getConfig("mapConfig"); // We want to propagate the events from the download function so that it ripples through to other
    // parts of the system, namely the clip functionality.

    /*
                $rootScope.$on('ed.clip.extent.change.out', function showBbox(event, data) {
                   console.log("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
                });
                    $rootScope.$on('ed.clip.extent.change.in', function showBbox(event, data) {
                   console.log("GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGE");
                });
    */

    $rootScope.$on('icsm.bounds.draw', function showBbox(event, bbox) {
      // 149.090045383719,-35.4,149.4,-35.3
      if (!bbox) {
        makeBounds(null);
        return;
      }

      var zoom = false;
      var xmax = bbox[2],
          xmin = bbox[0],
          ymax = bbox[3],
          ymin = bbox[1];

      if (bbox.length > 4) {
        zoom = bbox[4];
      } // It's a bbox.


      makeBounds({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]]]
        },
        properties: {}
      }, zoom);
    });
    $rootScope.$on('icsm.bbox.draw', function showBbox(event, bbox) {
      // 149.090045383719,-35.4,149.4,-35.3
      if (!bbox) {
        makeGeoJson(null);
        return;
      }

      var xmax = bbox[2],
          xmin = bbox[0],
          ymax = bbox[3],
          ymin = bbox[1]; // It's a bbox.

      makeGeoJson({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]]]
        },
        properties: {}
      }, false);
    });
    $rootScope.$on('icsm.poly.draw', function showBbox(event, data) {
      // It's a polygon geometry and it has a single ring.
      makePoly(data, true);
    });

    if (config.listenForMarkerEvent) {
      $rootScope.$on(config.listenForMarkerEvent, function showBbox(event, geojson) {
        // It's a GeoJSON Polygon geometry and it has a single ring.
        makeMarker(geojson);
      });
    }

    function makeMarker(data) {
      mapService.getMap().then(function (map) {
        if (marker) {
          map.removeLayer(marker);
        }

        if (!data) {
          return;
        }

        var point;

        if (typeof data.properties.SAMPLE_LONGITUDE !== "undefined") {
          point = {
            type: "Point",
            coordinates: [data.properties.SAMPLE_LONGITUDE, data.properties.SAMPLE_LATITUDE]
          };
        } else {
          point = data.geometry;
        }

        marker = L.geoJson({
          type: "Feature",
          geometry: point,
          id: data.id
        }).addTo(map);

        if (data.properties.html) {
          marker.bindPopup(data.properties.html).openPopup();
        }
      });
    }

    function makeGeoJson(data, zoomTo) {
      mapService.getMap().then(function (map) {
        if (bbox) {
          map.removeLayer(bbox);
        }

        if (data) {
          bbox = L.geoJson(data, {
            style: function style(feature) {
              return {
                opacity: 1,
                clickable: false,
                fillOpacity: 0,
                color: "red"
              };
            }
          }).addTo(map);

          if (zoomTo) {
            $timeout(function () {
              var bounds = bbox.getBounds();
              map.fitBounds(bounds, {
                animate: true,
                padding: L.point(100, 100)
              });
            }, 50);
          }
        }
      });
    }

    function makePoly(data, zoomTo) {
      mapService.getMap().then(function (map) {
        if (poly) {
          map.removeLayer(poly);
        }

        if (data) {
          poly = L.polygon(data, {
            opacity: 1,
            clickable: false,
            fillOpacity: 0,
            color: "black"
          }).addTo(map);

          if (zoomTo) {
            $timeout(function () {
              var bounds = poly.getBounds();
              map.fitBounds(bounds, {
                animate: true,
                padding: L.point(100, 100)
              });
            }, 50);
          }
        }
      });
    }

    function makeBounds(data, zoomTo) {
      mapService.getMap().then(function (map) {
        if (poly) {
          map.removeLayer(poly);
        }

        if (data) {
          poly = L.geoJson(data, {
            style: function style(feature) {
              return {
                opacity: 1,
                clickable: false,
                fillOpacity: 0,
                color: "black"
              };
            }
          }).addTo(map);

          if (zoomTo) {
            $timeout(function () {
              var boundingBox = poly.getBounds();
              map.fitBounds(boundingBox, {
                animate: true,
                padding: L.point(100, 100)
              });
            }, 50);
          }
        }
      });
    }

    function clip(num, min, max) {
      return Math.min(Math.max(num, min), max);
    }

    return {
      tickle: function tickle() {
        mapService.getMap().then(function (map) {
          map.on('click', function (event) {
            var zoom = map.getZoom();
            var latlng = event.latlng;
            $rootScope.$broadcast("zoom.to", {
              zoom: zoom,
              latlng: latlng
            });
          });
        });
      }
    };
  }]);
}
"use strict";

{
  var PaneCtrl = function PaneCtrl(paneService) {
    var _this = this;

    paneService.data().then(function (data) {
      _this.data = data;
    });
  };

  var PaneService = function PaneService() {
    var data = {};
    return {
      add: function add(item) {},
      remove: function remove(item) {}
    };
  };

  angular.module("icsm.panes", []).directive("icsmPanes", ['$rootScope', '$timeout', 'mapService', function ($rootScope, $timeout, mapService) {
    return {
      templateUrl: "icsm/panes/panes.html",
      transclude: true,
      scope: {
        defaultItem: "@",
        data: "="
      },
      controller: ['$scope', function ($scope) {
        var changeSize = false;
        $rootScope.$on('side.panel.change', function (event) {
          emitter();
          $timeout(emitter, 100);
          $timeout(emitter, 200);
          $timeout(emitter, 300);
          $timeout(emitter, 500);

          function emitter() {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent("resize", false, true);
            window.dispatchEvent(evt);
          }
        });
        $scope.view = $scope.defaultItem;
        $rootScope.$broadcast("view.changed", $scope.view, null);

        $scope.setView = function (what) {
          var oldView = $scope.view;

          if ($scope.view === what) {
            if (what) {
              changeSize = true;
            }

            $scope.view = "";
          } else {
            if (!what) {
              changeSize = true;
            }

            $scope.view = what;
          }

          $rootScope.$broadcast("view.changed", $scope.view, oldView);

          if (changeSize) {
            mapService.getMap().then(function (map) {
              map._onResize();
            });
          }
        };

        $timeout(function () {
          $rootScope.$broadcast("view.changed", $scope.view, null);
        }, 50);
      }]
    };
  }]).directive("icsmTabs", [function () {
    return {
      templateUrl: "icsm/panes/tabs.html",
      require: "^icsmPanes"
    };
  }]).controller("PaneCtrl", PaneCtrl).factory("paneService", PaneService);
  PaneCtrl.$inject = ["paneService"];
  PaneService.$inject = [];
}
"use strict";

{
  angular.module("icsm.message", []).directive("icsmMessage", ['icsmMessageService', function (icsmMessageService) {
    return {
      templateUrl: "icsm/message/message.html",
      link: function link(scope, element) {
        scope.message = icsmMessageService.data;
      }
    };
  }]).factory("icsmMessageService", ['$timeout', function ($timeout) {
    var data = {};
    var service = {
      get data() {
        return data;
      },

      wait: function wait(text) {
        return service.message("wait", text);
      },
      info: function info(text) {
        return service.message("info", text);
      },
      warn: function warn(text) {
        return service.message("warn", text);
      },
      error: function error(text) {
        return service.message("error", text);
      },
      clear: function clear() {
        return service.message(null, null);
      },
      message: function message(type, text) {
        data.type = type;
        data.text = text;
        $timeout(function () {
          service.removeFlash();
        }, 100000);
      },
      flash: function flash(text) {
        return service.message("flash", text);
      },
      removeFlash: function removeFlash() {
        data.type = null;
      }
    };
    return service;
  }]);
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

{
  angular.module("icsm.parameters", []).factory("parametersService", ["$location", function ($location) {
    // We read the parameters once only. Then the app can decide what to do with them.
    var Service = /*#__PURE__*/function () {
      function Service(search) {
        _classCallCheck(this, Service);

        this.search = search;
      }

      _createClass(Service, [{
        key: "ignoreSizeLimit",
        value: function ignoreSizeLimit() {
          return !!this.search.metadata;
        }
      }, {
        key: "hasValidBbox",
        value: function hasValidBbox() {
          var parameters = this.search;
          return !(isNaN(parameters.minx) || isNaN(parameters.maxx) || isNaN(parameters.miny) || isNaN(parameters.maxy));
        }
      }, {
        key: "clear",
        value: function clear() {
          this.search = {};
        }
      }, {
        key: "bbox",
        get: function get() {
          return this.hasValidBbox() ? {
            minx: +this.search.minx,
            maxx: +this.search.maxx,
            miny: +this.search.miny,
            maxy: +this.search.maxy
          } : null;
        }
      }, {
        key: "clip",
        get: function get() {
          return this.hasValidBbox() ? {
            xMin: +this.search.minx,
            xMax: +this.search.maxx,
            yMin: +this.search.miny,
            yMax: +this.search.maxy,
            metadata: this.search.metadata,
            polygon: this.polygon
          } : null;
        }
      }, {
        key: "bounds",
        get: function get() {
          var s = this.search;
          return this.hasValidBbox() ? L.latLngBounds([s.miny, s.minx], [s.maxy, s.maxx]) : null;
        }
      }, {
        key: "polygon",
        get: function get() {
          return "POLYGON((" + this.search.minx + " " + this.search.miny + "," + this.search.minx + " " + this.search.maxy + "," + this.search.maxx + " " + this.search.maxy + "," + this.search.maxx + " " + this.search.miny + "," + this.search.minx + " " + this.search.miny + "))";
        }
      }, {
        key: "data",
        get: function get() {
          // Just a wrapper around bounds same as draw does.
          return this.hasValidBbox() ? {
            bounds: this.bounds,
            metadata: this.metadata,
            polygon: this.polygon
          } : null;
        }
      }, {
        key: "metadata",
        get: function get() {
          return this.search.metadata;
        }
      }]);

      return Service;
    }();

    ;
    var service = new Service($location.search());
    return service;
  }]);
}
"use strict";

L.Control.ElevationControl = L.Control.extend({
  statics: {
    TITLE: 'Find elevation at a point',
    ALT_TITLE: 'Disable elevation at a point',
    CLASS_NAME: "leaflet-control-elevation",
    ALT_CLASS_NAME: "leaflet-control-alt-elevation"
  },
  options: {
    position: 'topleft',
    handler: {}
  },
  toggle: function toggle() {
    var handler = this.options.handler;
    var handleClick = this.handleClick;

    if (handler.enabled()) {
      this._map._container.style.cursor = "";

      this._map.fire(L.Control.ElevationControl.Event.POINTEND, {});

      this._map.off('click', handleClick);

      this.link.title = L.Control.ElevationControl.TITLE;
      L.DomUtil.removeClass(this.link, L.Control.ElevationControl.ALT_CLASS_NAME);
      L.DomUtil.addClass(this.link, L.Control.ElevationControl.CLASS_NAME);
      handler.disable();
    } else {
      this._map.fire(L.Control.ElevationControl.Event.POINTSTART, {});

      this._map._container.style.cursor = "crosshair";

      this._map.on('click', handleClick);

      this.link.title = L.Control.ElevationControl.ALT_TITLE;
      L.DomUtil.removeClass(this.link, L.Control.ElevationControl.CLASS_NAME);
      L.DomUtil.addClass(this.link, L.Control.ElevationControl.ALT_CLASS_NAME);
      handler.enable();
    }
  },
  onAdd: function onAdd(map) {
    var _this = this;

    var className = L.Control.ElevationControl.CLASS_NAME;
    this._container = L.DomUtil.create('div', 'leaflet-bar');
    var link = this.link = L.DomUtil.create('a', className, this._container);
    link.href = '#';
    link.title = L.Control.ElevationControl.TITLE;
    L.DomEvent.addListener(link, 'click', L.DomEvent.stopPropagation).addListener(link, 'click', L.DomEvent.preventDefault).addListener(link, 'click', this.toggle, this);
    map.on("draw:drawstart", function () {
      _this.clear();
    });

    this.clear = function () {
      var handler = this.options.handler;

      if (handler.enabled()) {
        this.toggle();
      }
    };

    this.handleClick = function handleClick(me) {
      return function (e) {
        me.searching(e.latlng);
      };
    }(this.options.handler);

    return this._container;
  }
});
L.Map.mergeOptions({
  elevationControl: false
});

L.Control.elevationControl = function (options) {
  return new L.Control.ElevationControl(options);
};

L.Control.ElevationControl.Event = {
  POINTSTART: "point:start",
  POINTEND: "point:end"
};
{
  angular.module("icsm.point", []).directive("pointElevation", ["elevationPointsService", "flashService", "mapService", function (elevationPointsService, flashService, mapService) {
    return {
      restrict: "AE",
      link: function link(scope) {
        var flasher = null;
        mapService.getMap().then(function (map) {
          scope.map = map;
          L.Control.ElevationControl.ALT_TITLE = 'Find features around a point';
          scope.control = L.Control.elevationControl({
            handler: handler
          }).addTo(map);
          console.log("Point signing in");
        });
        var handler = {
          disable: function disable() {
            scope.enabled = false;
            console.log("Disable elevation handler here");
            flashService.remove(flasher);
            map.closePopup();
            flasher = flashService.add("Click map for datasets surrounding a point.", 4000);
          },
          enable: function enable(map) {
            scope.enabled = true;
            scope.$apply(function () {
              flashService.remove(flasher);
              flasher = flashService.add("Click map for detailed elevation information at point", 4000);
            });
          },
          enabled: function enabled() {
            return scope.enabled;
          },
          searching: function searching(latlng) {
            flashService.remove(flasher);
            scope.elevation = scope.error = null;
            flasher = flashService.add("Retrieving elevation data", 20000, true);
            elevationPointsService.getHiResElevation(latlng).then(function (response) {
              var data = response.data;
              var map = scope.map;
              flashService.remove(flasher);
              /*
                 "SOURCE": "Geoscience Australia",
                 "DATASET": "SRTM-derived 1 Second Digital Elevation Models Version 1.0",
                 "DEM RESOLUTION": "30m",
                 "HEIGHT AT LOCATION": "524.67m",
                 “METADATA_URL”: “https://ecat.ga.gov.au/geonetwork/srv/eng/catalog.search#/metadata/22be4b55-2465-4320-e053-10a3070a5236”
              */

              var elevation = data["HEIGHT AT LOCATION"];
              var buffer = [];
              var lat = latlng.lat.toFixed(5) + "&deg;";
              var lng = latlng.lng.toFixed(5) + "&deg;";

              if (elevation === "m" || elevation === undefined || elevation === "No data") {
                buffer.push(title("Lat/Lng") + lat + "/" + lng);
                buffer.push("<strong>No data available at this point</strong>");
              } else {
                buffer.push(title("Elevation") + elevation);
                buffer.push(title("Lat/Lng") + lat + "/" + lng);
                buffer.push(title("Source") + data.SOURCE);
                buffer.push(title("Dataset") + "<span class='elevation-popup ellipsis' title='" + data.DATASET + "'>" + metadataLink(data.DATASET, data["METADATA URL"]) + "</span>");
                buffer.push(title("DEM Resolution") + data["DEM RESOLUTION"]);
              }

              L.popup({
                maxWidth: 400
              }).setLatLng(latlng).setContent("<div class='fi-popup'>" + buffer.join("<br/>") + "</div>").openOn(map);
              scope.elevation = data;
            })["catch"](function (e) {
              flashService.remove(flasher);
              scope.error = "No data available at this point";
            });

            function title(text) {
              return "<strong>" + text + ":</strong> ";
            }

            function metadataLink(text, link) {
              if (!link) return text;
              return "<a href='" + link + "' target='_blank'>" + text + "</a>";
            }
          }
        };
      }
    };
  }]);
}
"use strict";

{
  var fileSize = function fileSize(size) {
    var meg = 1000 * 1000;
    var gig = meg * 1000;
    var ter = gig * 1000;

    if (!size) {
      return "-";
    }

    if (("" + size).indexOf(" ") > -1) {
      return size;
    }

    size = parseFloat(size);

    if (size < 1000) {
      return size + " bytes";
    }

    if (size < meg) {
      return (size / 1000).toFixed(1) + " kB";
    }

    if (size < gig) {
      return (size / meg).toFixed(1) + " MB";
    }

    if (size < ter) {
      return (size / gig).toFixed(1) + " GB";
    }

    return (size / ter).toFixed(1) + " TB";
  };

  angular.module("icsm.polygon", ["icsm.message"]).directive('icsmPolygon', ['$rootScope', 'icsmMessageService', 'polygonService', function ($rootScope, icsmMessageService, polygonService) {
    return {
      restrict: 'AE',
      link: function link() {
        polygonService.init().then(null, null, function notify(message) {
          icsmMessageService.removeFlash();

          switch (message.type) {
            case "error":
            case "warn":
            case "info":
              icsmMessageService[message.type](message.text);
              break;

            case "wait":
              icsmMessageService.wait(message.text);
              break;

            default:
              icsmMessageService.flash(message.text, message.duration ? message.duration : 8000, message.type === "wait");
          }
        });
      }
    };
  }]).factory("polygonService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService', 'messageService', function ($http, $q, $rootScope, $timeout, configService, flashService, messageService) {
    var notify;
    return {
      init: function init() {
        return $q(function (resolve, reject) {
          $rootScope.$on('icsm.polygon.drawn', function (event, clip) {
            send('Area drawn. Checking for data...');

            _checkSize(clip).then(function (message) {
              if (message.code === "success") {
                getList(clip);
              }
            });
          });
        });
      },
      cancelDraw: function cancelDraw() {
        drawService.cancelDraw();
      },
      checkSize: function checkSize(clip) {
        return _checkSize(clip);
      }
    };

    function send(message, type, duration) {
      flashService.remove(notify);

      if (message) {
        if (type === "error") {
          messageService.error(message);
        } else {
          notify = flashService.add(message, duration, true);
        }
      }
    }

    function _checkSize(clip) {
      var deferred = $q.defer();
      var result = drawn(clip);

      if (result && result.code) {
        switch (result.code) {
          case "oversize":
            $timeout(function () {
              send("", "clear");
              send("The selected polygon's bounds exceeds the practical search size. Please confine your polygon within a bounds of approximately " + "1.5 degrees square.", "error");
              deferred.resolve(result);
            });
            break;

          case "undersize":
            $timeout(function () {
              send("", "clear");
              send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " + "Please update the drawn area.", "error");
              deferred.resolve(result);
            });
            break;

          default:
            return $q.when(result);
        }
      }

      return deferred.promise;
    }

    function underSizeLimit(clip) {
      var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
      return size < 0.00000000001 || clip.xMax < clip.xMin;
    }

    function overSizeLimit(clip) {
      // Shouldn't need abs but it doesn't hurt.
      var size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
      return size > 2.25;
    }

    function drawn(clip) {
      if (overSizeLimit(clip)) {
        return {
          code: "oversize"
        };
      }

      if (underSizeLimit(clip)) {
        return {
          code: "undersize"
        };
      }

      if (clip.xMax === null) {
        return {
          code: "incomplete"
        };
      }

      if (validClip(clip)) {
        return {
          code: "success"
        };
      }

      return {
        code: "invalid"
      };
    } // The input validator takes care of order and min/max constraints. We just check valid existance.


    function validClip(clip) {
      return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip) && !underSizeLimit(clip);
    }

    function getList(clip) {
      configService.getConfig("processing").then(function (conf) {
        var url = conf.intersectsUrl;

        if (url) {
          // Order matches the $watch signature so be careful
          var polygon = clip.polygon;
          var params = ["polygon=" + encodeURIComponent(polygon)];

          if (clip.metadata) {
            params.push("metadata=" + clip.metadata);
          }

          send("Checking there is data in your selected area...", "wait", 180000);
          $http.get(url + params.join("&")).then(function (response) {
            if (response.data && response.data.available_data) {
              var hasData = false;
              send("", "clear");

              if (response.data.available_data) {
                response.data.available_data.forEach(function (group) {
                  if (group.downloadables) {
                    decorateDownloadables(group.downloadables);
                    hasData = true;
                  }
                });
              }

              if (!hasData) {
                send("There is no data held in your selected area. Please try another area.", null, 4000);
              }

              $rootScope.$broadcast('site.selection', response.data);
            }
          }, function (err) {
            // If it falls over we don't want to crash.
            send("The service that provides the list of datasets is currently unavailable. " + "Please try again later.", "error");
          });
        }
      });

      function decorateDownloadables(downloadables) {
        Object.keys(downloadables).forEach(function (groupname) {
          var group = downloadables[groupname];
          Object.keys(group).forEach(function (listName) {
            var items = group[listName];
            items.forEach(function (item) {
              return decorateItem(item);
            });
          });
        });
      }

      function decorateItem(item) {
        item.fileSize = fileSize(item.file_size);

        if (item.product) {
          //  "bbox" : "113,-44,154,-10"
          var arr = item.bbox.split(",").map(function (num) {
            return +num;
          });
          item.bbox = [Math.max(arr[0], clip.xMin), Math.max(arr[1], clip.yMin), Math.min(arr[2], clip.xMax), Math.min(arr[3], clip.yMax)].join(",");
        }
      }
    }
  }]);
}
"use strict";

{
  var validClip = function validClip(clip) {
    var valid = isFinite(clip.yMax) && isFinite(clip.xMax) && isFinite(clip.yMin) && isFinite(clip.xMin);
    valid = valid && clip.yMax < 90 && clip.yMin > -90 && clip.xMax <= 180 && clip.xMin >= -180;
    valid = valid && clip.yMax > clip.yMin && clip.xMax > clip.xMin;
    return valid;
  };

  var DownloadService = function DownloadService(productsMapUtilsService, persistService) {
    var key = "download_email";
    var CLIPOPTIONS = {
      weight: 2,
      opacity: 0.9,
      fill: false,
      color: "#000000",
      width: 3,
      clickable: false
    };
    return {
      showClip: function showClip(clip) {
        this.removeClip(clip.layer);
        var bounds = [[clip.yMin, clip.xMin], [clip.yMax, clip.xMax]];
        clip.layer = productsMapUtilsService.createBounds(bounds, CLIPOPTIONS);
        productsMapUtilsService.showLayer(clip.layer);
      },
      removeClip: function removeClip(layer) {
        if (layer) {
          productsMapUtilsService.hideLayer(layer);
        }
      },
      setEmail: function setEmail(email) {
        persistService.setItem(key, email);
      },
      getEmail: function getEmail() {
        return persistService.getItem(key).then(function (value) {
          return value;
        });
      },
      // https://elvis2018-ga.fmecloud.com/fmejobsubmitter/fsdf_elvis_prod/DEMClipZipShip_Master_S3Source.fmw?geocat_number=${id}&out_grid_name=${filename}&input_coord_sys=LL-WGS84&ymin=${yMin}&ymax=${yMax}&xmin=${xMin}&xmax=${xMax}&output_format=${outFormat}&out_coord_sys=${outCoordSys}&email_address=${email}&opt_showresult=false&opt_servicemode=async
      submit: function submit(template, parameters) {
        var workingString = template;
        angular.forEach(parameters, function (item, key) {
          workingString = workingString.replace("${" + key + "}", item);
        });
        $("#launcher")[0].src = workingString;
      }
    };
  }; // The input validator takes care of order and min/max constraints. We just check valid existance.


  var validSize = function validSize(clip) {
    var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;
    return clip && angular.isNumber(clip.xMax) && angular.isNumber(clip.xMin) && angular.isNumber(clip.yMax) && angular.isNumber(clip.yMin) && !overSizeLimit(clip, size) && !underSizeLimit(clip);
  };

  var underSizeLimit = function underSizeLimit(clip) {
    var size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
    return size < 0.00000000001 || clip.xMax < clip.xMin;
  };

  var overSizeLimit = function overSizeLimit(clip, size) {
    // Shouldn't need abs but it doesn't hurt.
    var actual = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
    return size && actual > size;
  };

  var constrainBounds = function constrainBounds(c, p) {
    var flag = false,
        ret = false; // Have we read the parameters yet?

    if (!p || empty(c.xMax) || empty(c.xMin) || empty(c.yMax) || empty(c.yMin)) {
      return false;
    }

    ret = flag = +c.xMax < +p.xMin;

    if (flag) {
      c.xMax = +p.xMin;
    }

    flag = +c.xMax > +p.xMax;
    ret = ret || flag;

    if (flag) {
      c.xMax = +p.xMax;
    }

    flag = +c.xMin < +p.xMin;
    ret = ret || flag;

    if (flag) {
      c.xMin = +p.xMin;
    }

    flag = +c.xMin > +c.xMax;
    ret = ret || flag;

    if (flag) {
      c.xMin = c.xMax;
    } // Now for the Y's


    flag = +c.yMax < +p.yMin;
    ret = ret || flag;

    if (flag) {
      c.yMax = +p.yMin;
    }

    flag = +c.yMax > +p.yMax;
    ret = ret || flag;

    if (flag) {
      c.yMax = +p.yMax;
    }

    flag = +c.yMin < +p.yMin;
    ret = ret || flag;

    if (flag) {
      c.yMin = +p.yMin;
    }

    flag = +c.yMin > +c.yMax;
    ret = ret || flag;

    if (flag) {
      c.yMin = +c.yMax;
    }

    return ret;

    function empty(val) {
      return angular.isUndefined(val) || val === "" || val === null;
    }
  };

  angular.module("product.download", []).directive("productDownloadButton", ['configService', function (configService) {
    return {
      template: "<button ng-click='item.showDownload = !item.showDownload' type='button' class='undecorated' title='Click to start download'>" + "<i class='fa fa-lg fa-download' ng-class='{active:item.showDownload}'></i></button>",
      scope: {
        item: "="
      },
      link: function link(scope, element, attrs) {
        console.log("What's up item!");
      }
    };
  }]).directive("productDownloadPanel", ['$rootScope', 'productDownloadService', 'flashService', function ($rootScope, productDownloadService, flashService) {
    return {
      templateUrl: "icsm/products/download.html",
      scope: {
        item: "="
      },
      link: function link(scope, element, attrs) {
        var clipMessage;
        scope.processing = {
          clip: {},

          get valid() {
            return this.validClipSize && this.validEmail;
          },

          get validClip() {
            return validClip(this.clip);
          },

          get validClipSize() {
            return validClip(this.clip) && validSize(this.clip, scope.item.restrictSize);
          },

          get validEmail() {
            return this.email;
          },

          get validProjection() {
            return this.outCoordSys;
          },

          get validFormat() {
            return this.outFormat;
          },

          get percentComplete() {
            return (this.validClip ? 25 : 0) + (this.validEmail ? 25 : 0) + (this.validProjection ? 25 : 0) + (this.validFormat ? 25 : 0);
          }

        };
        scope.item.processing = scope.processing;

        scope.drawn = function () {
          return draw();
        };

        $rootScope.$on('icsm.clip.drawn', function (event, clip) {
          scope.processing.clip = {
            xMax: clip.xMax,
            xMin: clip.xMin,
            yMax: clip.yMax,
            yMin: clip.yMin
          };
          scope.processing.message = "";

          if (!scope.processing.validClip) {
            scope.processing.message = "That is not a valid area for this dataset";
          } else {
            if (constrainBounds(scope.processing.clip, scope.item.bounds)) {
              scope.processing.message = "Bounds restricted to fit within product's extent";
            }

            if (!validSize(scope.processing.clip, scope.item.restrictSize)) {
              scope.processing.message = "That exceeds the area you can clip for this dataset. Restrict to " + scope.item.restrictSize + " square degrees.";
            }
          }
        });
        scope.$watch('item.showDownload', function (value, oldValue) {
          if (value && !scope.processing.email) {
            productDownloadService.getEmail().then(function (email) {
              scope.processing.email = email;
            });
          }
        });
      }
    };
  }]).directive("productDownloadSubmit", ['configService', 'productDownloadService', 'messageService', function (configService, productDownloadService, messageService) {
    return {
      templateUrl: "icsm/products/submit.html",
      scope: {
        item: "=",
        processing: "="
      },
      link: function link(scope, element, attrs) {
        scope.submit = function () {
          var processing = scope.processing;
          productDownloadService.setEmail(processing.email); // Assemble data

          productDownloadService.submit(scope.item.template, {
            id: scope.item.primaryId,
            yMin: processing.clip.yMin,
            yMax: processing.clip.yMax,
            xMin: processing.clip.xMin,
            xMax: processing.clip.xMax,
            outFormat: processing.outFormat.code,
            outCoordSys: processing.outCoordSys.code,
            email: processing.email,
            filename: ""
          });
          messageService.success("Submitted your job. An email will be delivered on completion.");
        };
      }
    };
  }]).factory("productDownloadService", DownloadService);
  DownloadService.$invoke = ['productsMapUtilsService', 'persistService'];
}
"use strict";

{
  var intersecting = function intersecting(collection, extent) {
    // The extent may have missing numbers so we don't restrict at that point.
    if (!extent || !collection || !angular.isNumber(extent.xMin) || !angular.isNumber(extent.xMax) || !angular.isNumber(extent.yMin) || !angular.isNumber(extent.yMax)) {
      return collection;
    }

    return collection.filter(function (item) {
      // We know these have valid numbers if it exists
      if (!item.extent) {
        return true;
      } // We have a restriction


      return item.extent.xMin <= extent.xMin && item.extent.xMax >= extent.xMax && item.extent.yMin <= extent.yMin && item.extent.yMax >= extent.yMax;
    });
  };

  angular.module("icsm.product", ["product.download"]).directive("productProjection", ['productsConfigService', function (productsConfigService) {
    return {
      templateUrl: "icsm/products/projection.html",
      scope: {
        processing: "="
      },
      link: function link(scope) {
        productsConfigService.config.then(function (config) {
          scope.config = config;
        });
      }
    };
  }]).directive("productFormats", ['productsConfigService', function (productsConfigService) {
    return {
      templateUrl: "icsm/products/formats.html",
      scope: {
        processing: "="
      },
      link: function link(scope) {
        productsConfigService.config.then(function (config) {
          scope.config = config;
        });
        console.log("What's up doc!");
      }
    };
  }]).directive('productEmail', [function () {
    return {
      templateUrl: 'icsm/products/email.html',
      scope: {
        processing: "="
      }
    };
  }]).filter("productIntersect", function () {
    return intersecting;
  });
  ;
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

{
  angular.module("icsm.products", ["icsm.product"]).provider('productsConfigService', [function () {
    var location = "icsm/resources/config/download.json";

    this.setLocation = function (newLocation) {
      location = newLocation;
    };

    this.$get = ["$http", function factory($http) {
      return new DownloadConfig(location, $http);
    }];
  }]);

  var DownloadConfig = /*#__PURE__*/function () {
    function DownloadConfig(url, $http) {
      _classCallCheck(this, DownloadConfig);

      this.$http = $http;
      this.location = url;
    }

    _createClass(DownloadConfig, [{
      key: "child",
      value: function child(name) {
        return this.config.then(function (data) {
          return data[name];
        });
      }
    }, {
      key: "initiateServiceTemplates",
      get: function get() {
        return child('initiateServiceTemplates');
      }
    }, {
      key: "processingTemplates",
      get: function get() {
        return this.child('processing');
      }
    }, {
      key: "outputFormat",
      get: function get() {
        return this.child('outFormat');
      }
    }, {
      key: "defaultOutputFormat",
      get: function get() {
        return this.outputFormat.then(function (list) {
          return list.find(function (item) {
            return item["default"];
          });
        });
      }
    }, {
      key: "defaultOutputCoordinateSystem",
      get: function get() {
        return this.outputCoordinateSystem.then(function (systems) {
          return systems.find(function (item) {
            return item["default"];
          });
        });
      }
    }, {
      key: "outputCoordinateSystem",
      get: function get() {
        return this.child('outCoordSys');
      }
    }, {
      key: "datasets",
      get: function get() {
        return this.child('datasets');
      }
    }, {
      key: "config",
      get: function get() {
        return this.$http.get(this.location, {
          cache: true
        }).then(function (response) {
          return response.data;
        });
      }
    }]);

    return DownloadConfig;
  }();
}
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

{
  angular.module("icsm.preview", []).directive("previewImage", ["$rootScope", function ($rootScope) {
    return {
      templateUrl: "icsm/preview/preview.html",
      restrict: "AE",
      link: function link(scope) {
        /* Test. If you uncomment out this it will show up on page load.
        scope.image = {
           url: "icsm/resources/img/fbimage.jpg",
           item: {
              file_name: "Test_Image.zip"
           }
        };
         */
        scope.clear = function () {
          scope.previewData = null;
        };

        $rootScope.$on("icsm-preview", function (event, data) {
          scope.previewData = data;
        });
      }
    };
  }]).factory("previewService", [function () {
    // We read the parameters once only. Then the app can decide what to do with them.
    var Service = /*#__PURE__*/function () {
      function Service(search) {
        _classCallCheck(this, Service);

        this.search = search;
      }

      _createClass(Service, [{
        key: "ignoreSizeLimit",
        value: function ignoreSizeLimit() {
          return !!this.search.metadata;
        }
      }, {
        key: "hasValidBbox",
        value: function hasValidBbox() {
          var parameters = this.search;
          return !(isNaN(parameters.minx) || isNaN(parameters.maxx) || isNaN(parameters.miny) || isNaN(parameters.maxy));
        }
      }, {
        key: "clear",
        value: function clear() {
          this.search = {};
        }
      }, {
        key: "bbox",
        get: function get() {
          return this.hasValidBbox() ? {
            minx: +this.search.minx,
            maxx: +this.search.maxx,
            miny: +this.search.miny,
            maxy: +this.search.maxy
          } : null;
        }
      }, {
        key: "clip",
        get: function get() {
          return this.hasValidBbox() ? {
            xMin: +this.search.minx,
            xMax: +this.search.maxx,
            yMin: +this.search.miny,
            yMax: +this.search.maxy,
            metadata: this.search.metadata
          } : null;
        }
      }, {
        key: "bounds",
        get: function get() {
          var s = this.search;
          return this.hasValidBbox() ? L.latLngBounds([s.miny, s.minx], [s.maxy, s.maxx]) : null;
        }
      }, {
        key: "data",
        get: function get() {
          // Just a wrapper around bounds same as draw does.
          return this.hasValidBbox() ? {
            bounds: this.bounds,
            metadata: this.metadata
          } : null;
        }
      }, {
        key: "metadata",
        get: function get() {
          return this.search.metadata;
        }
      }]);

      return Service;
    }();

    ;
    var service = new Service($location.search());
    return service;
  }]);
}
"use strict";

{
  angular.module("elvis.results.continue", []).directive('icsmSearchContinue', ['configService', 'continueService', function (configService, continueService) {
    return {
      templateUrl: 'icsm/results/continue.html',
      controller: 'listCtrl',
      controllerAs: 'ctrl',
      link: function link(scope, element) {
        configService.getConfig("downloadLimit").then(function (size) {
          scope.limit = size;
        });
        scope.data = continueService.data;
      }
    };
  }]).factory('continueService', ['listService', function (listService) {
    var service = {};
    service.data = listService.data;
    return service;
  }]).filter("someSelected", function () {
    return function (products) {
      return products && products.some(function (item) {
        return item.selected;
      });
    };
  }).filter("countSelected", function () {
    return function (products) {
      return products ? products.filter(function (item) {
        return item.selected;
      }).length : '';
    };
  });
}
"use strict";

{
  var fileSize = function fileSize(size) {
    var meg = 1000 * 1000;
    var gig = meg * 1000;
    var ter = gig * 1000;

    if (!size) {
      return "-";
    }

    if (("" + size).indexOf(" ") > -1) {
      return size;
    }

    size = parseFloat(size);

    if (size < 1000) {
      return size + " bytes";
    }

    if (size < meg) {
      return (size / 1000).toFixed(1) + " kB";
    }

    if (size < gig) {
      return (size / meg).toFixed(1) + " MB";
    }

    if (size < ter) {
      return (size / gig).toFixed(1) + " GB";
    }

    return (size / ter).toFixed(1) + " TB";
  };

  var ListCtrl = function ListCtrl(listService) {
    this.service = listService;

    this.checkChildren = function (children) {
      var allChecked = this.childrenChecked(children);
      var filtered = children;

      if (!allChecked) {
        filtered = children.filter(function (child) {
          return child.matched;
        });
      }

      filtered.forEach(function (child) {
        if (allChecked) {
          delete child.selected;
        } else {
          child.selected = true;
        }
      });
    };

    this.childrenChecked = function (children) {
      return !children.filter(function (child) {
        return child.matched;
      }).some(function (child) {
        return !child.selected;
      });
    };

    this.someMatches = function (products) {
      var matches = false;
      angular.forEach(products.downloadables, function (group) {
        angular.forEach(group, function (subGroup) {
          matches |= subGroup.some(function (item) {
            return item.matched;
          });
        });
      });
      return matches;
    };

    this.someChildMatches = function (downloadables) {
      var matches = false;
      angular.forEach(group, function (subGroup) {
        matches |= subGroup.some(function (item) {
          return item.matched;
        });
      });
      return matches;
    };

    this.review = function () {
      this.service.data.reviewing = true;
    };

    this.cancelReview = function () {
      this.service.data.reviewing = false;
    };
  };

  angular.module("elvis.results", ['elvis.results.continue', 'icsm.subtype', 'icsm.unreleased']).directive('productsDialog', ['productsConfigService', 'listService', function (productsConfigService, listService) {
    return {
      restrict: 'AE',
      link: function link(scope) {
        var data = scope.processing = listService.data;
        productsConfigService.defaultOutputCoordinateSystem.then(function (item) {
          return data.outCoordSys = item;
        });
        productsConfigService.defaultOutputFormat.then(function (format) {
          return data.outFormat = format;
        });
      }
    };
  }]).directive('icsmOrgHeading', [function () {
    return {
      templateUrl: 'icsm/results/orgheading.html',
      restrict: 'AE',
      scope: {
        org: "=",
        mappings: "="
      },
      link: function link(scope) {
        scope.heading = function () {
          var source = scope.org.source;
          var mapping = scope.mappings[source];
          return mapping.displayName ? mapping.displayName : source;
        };
      }
    };
  }]).directive('icsmList', ['$rootScope', 'listService', function ($rootScope, listService) {
    return {
      templateUrl: 'icsm/results/results.html',
      link: function link(scope) {
        listService.getMappings().then(function (response) {
          scope.mappings = response;
        });
        scope.filters = listService.data;

        scope.update = function () {
          var filterExists = !!scope.filters.filter;
          var types = [];
          var typesExists = scope.filters.types.some(function (type) {
            return type.selected;
          }) && !scope.filters.types.every(function (type) {
            return type.selected;
          }); // Set up the default

          scope.products.forEach(function (product) {
            product.matched = !filterExists;
          }); // Do the types first

          if (typesExists) {
            scope.products.forEach(function (product) {
              product.matched = false;
              scope.filters.types.filter(function (type) {
                return type.selected;
              }).forEach(function (type) {
                if (type.match && type.match[product.type]) {
                  product.matched = true;
                } else if (type.noMatch && !type.noMatch[product.type]) {
                  product.matched = true;
                }
              });
            });
          } // Now do the filters


          if (filterExists) {
            var upperFilter = scope.filters.filter.toUpperCase();
            var products = scope.products;

            if (typesExists) {
              products = products.filter(function (item) {
                return item.matched;
              });
            }

            products.forEach(function (product) {
              var name = product.file_name || product.project_name || "";
              product.matched = name.toUpperCase().indexOf(upperFilter) > -1;
            });
          }

          scope.$broadcast("filter.changed");
        };

        scope.show = function (data) {
          var bbox = toNumberArray(data.bbox);
          $rootScope.$broadcast('icsm.bbox.draw', bbox);
        };

        scope.hide = function (data) {
          $rootScope.$broadcast('icsm.bbox.draw', null);
        };

        $rootScope.$on("clip.initiate.draw", function (event, data) {
          scope.list = null;
          scope.products = [];
          scope.productsMap = [];
        });
        $rootScope.$on('site.selection', function (event, data) {
          scope.list = null;
          scope.products = [];
          scope.productsMap = [];

          if (data.available_data) {
            scope.list = data.available_data.filter(function (org) {
              return org.downloadables;
            });
            scope.list.forEach(function (org) {
              angular.forEach(org.downloadables, function (types, type) {
                angular.forEach(types, function (group, groupType) {
                  group.forEach(function (product) {
                    product.source = org.source;
                    product.group = groupType;
                    product.type = type;
                    scope.productsMap[product.file_url] = product;
                    scope.products.push(product);
                  });
                });
              });
            });
            listService.products = scope.products;
          }

          scope.update();
        });

        scope.show = function (data) {
          var bbox = toNumberArray(data.bbox);
          $rootScope.$broadcast('icsm.bbox.draw', bbox);
        };

        scope.hide = function (data) {
          $rootScope.$broadcast('icsm.bbox.draw', null);
        };

        function decorateCounts(list, types) {
          // reset
          var checks = [];
          angular.forEach(types, function (type) {
            type.count = 0;
            checks.push(type);
          });

          if (list) {
            list.forEach(function (item) {
              item.downloadables.forEach(function (downloadable) {
                checks.forEach(function (check) {
                  check.count += downloadable[check.countField] ? 1 : 0;
                });
              });
            });
          }
        }

        function toNumberArray(numbs) {
          if (angular.isArray(numbs) || !numbs) {
            return numbs;
          }

          return numbs.split(/,\s*/g).map(function (numb) {
            return +numb;
          });
        }
      }
    };
  }]).directive('icsmAbstract', ['listService', function (listService) {
    return {
      templateUrl: "icsm/results/abstractbutton.html",
      scope: {
        item: "="
      },
      link: function link(scope) {
        scope.show = listService.hasMetadata(scope.item);

        scope.toggle = function () {
          scope.item.showAbstract = !scope.item.showAbstract;

          if (scope.item.showAbstract) {
            load();
          }
        };

        function load() {
          if (!scope.fetched) {
            scope.fetched = true;
            listService.getMetadata(scope.item).then(function (data) {
              scope.item.metadata = data;
            });
          }
        }
      }
    };
  }]) // All this does is set up the data on mouse hover. The UI can do whatever it wants with the data when it arrives
  .directive('icsmAbstractHover', ['$timeout', 'listService', function ($timeout, listService) {
    var TIME_DELAY = 250; // ms

    return {
      restrict: 'AE',
      scope: {
        item: "="
      },
      link: function link(scope, element) {
        var promise;
        element.on('mouseenter', function () {
          if (promise) {
            $timeout.cancel(promise);
          }

          promise = $timeout(load, TIME_DELAY);
        });
        element.on('mouseleave', function () {
          if (promise) {
            $timeout.cancel(promise);
            promise = null;
          }
        });

        function load() {
          if (!scope.fetched) {
            scope.fetched = true;
            listService.getMetadata(scope.item).then(function (data) {
              scope.item.metadata = data;
            });
          }
        }
      }
    };
  }]) // All this does is set up the data on mouse hover. The UI can do whatever it wants with the data when it arrives
  .directive('icsmAbstractLink', ['$timeout', 'listService', function ($timeout, listService) {
    return {
      restrict: 'AE',
      template: "<a target='_blank' ng-if='url' ng-href='{{url}}'>{{item[name]}}</a><span ng-if='!url' ng-bind='item.file_name'></span>",
      scope: {
        item: "=",
        name: "@?"
      },
      link: function link(scope, element) {
        if (!scope.name) {
          scope.name = "file_name";
        }

        var data = {
          file_name: scope.item[scope.name],
          metadata_url: scope.item.metadata_url,
          source: scope.item.source
        };
        scope.url = listService.getLink(data);
      }
    };
  }]).controller('listCtrl', ListCtrl).factory('listService', ['$http', '$rootScope', function ($http, $rootScope) {
    var service = {};
    var expansions = {};
    var strategies = new Strategies($http);
    service.data = {
      id: "listService_data",
      filter: "",
      types: []
    };
    $rootScope.$on('icsm.clip.drawn', function (event, clip) {
      return service.data.clip = clip;
    });
    $http.get('icsm/resources/config/filetypes.json').then(function (response) {
      service.data.typesMap = response.data;
      service.data.types = [];
      angular.forEach(response.data, function (value, key) {
        service.data.types.push(value);
      });
    });

    service.getMetadata = function (item) {
      return strategies.strategy(item.source).requestMetadata(item);
    };

    service.hasMetadata = function (item) {
      return strategies.strategy(item.source).hasMetadata(item);
    };

    service.getLink = function (item) {
      return strategies.strategy(item.source).constructLink(item);
    };

    service.getMappings = function () {
      return $http.get('icsm/resources/config/list.json').then(function (response) {
        return response.data;
      });
    };

    return service;
  }]).filter("allowedTypes", ['listService', function (listService) {
    return function (types) {
      if (!listService.data.types.some(function (type) {
        return type.selected;
      })) {
        return types;
      }

      var response = {};
      angular.forEach(types, function (item, key) {
        if (listService.data.typesMap && listService.data.typesMap[key] && listService.data.typesMap[key].selected) {
          response[key] = item;
        }
      });
      return response;
    };
  }]).filter("countMatchedDownloadables", function () {
    return function (downloadables) {
      if (!downloadables) {
        return "-";
      } else {
        var count = 0;
        angular.forEach(downloadables, function (types, key) {
          if (!Array.isArray(types)) {
            angular.forEach(types, function (items) {
              count += items.filter(function (item) {
                return item.matched;
              }).length;
            });
          }
        });
        return count;
      }
    };
  }).filter("countMatchedItems", function () {
    return function (items) {
      if (!items) {
        return "";
      } else {
        return items.filter(function (item) {
          return item.matched;
        }).length;
      }
    };
  }).filter("hasTypeMatches", function () {
    return function (types) {
      if (!types) {
        return false;
      }

      var count = 0;
      Object.keys(types).forEach(function (key) {
        count += types[key].filter(function (item) {
          return item.matched;
        }).length;
      });
      return count > 0;
    };
  }).filter("matchedTypes", function () {
    return function (obj) {
      var response = {};
      angular.forEach(obj, function (group, key) {
        if (group.some(function (item) {
          return item.matched;
        })) {
          response[key] = group;
        }
      });
      return response;
    };
  }).filter("matchedGroups", [function () {
    return function (obj) {
      var response = {};

      if (obj) {
        angular.forEach(obj, function (group, key) {
          if (group.some(function (item) {
            return item.matched;
          })) {
            response[key] = group;
          }
        });
      }

      return response;
    };
  }]).filter("matchedItems", function () {
    return function (list) {
      return list.filter(function (item) {
        return item.matched;
      });
    };
  }).filter("keysLength", [function () {
    return function (list) {
      if (!list) {
        return 0;
      }

      return Object.keys(list).reduce(function (sum, key) {
        return sum + list[key].length;
      }, 0);
    };
  }]).filter("countDownloadables", function () {
    return function (downloadables) {
      if (!downloadables) {
        return "-";
      } else {
        var count = 0;
        angular.forEach(downloadables, function (group, key) {
          angular.forEach(group, function (value, key) {
            count += value.length;
          });
        });
        return count;
      }
    };
  }).filter('fileSize', function () {
    return fileSize;
  });
  ListCtrl.$inject = ['listService'];
  ListCtrl.prototype = {
    get products() {
      return this.service.products;
    },

    get selectedSize() {
      var products = this.service.products;
      return (products ? products.filter(function (item) {
        return item.selected && !item.removed;
      }) : []).map(function (product) {
        return product.file_size ? +product.file_size : 500000000;
      }).reduce(function (prev, curr) {
        return prev + curr;
      }, 0);
    },

    get selected() {
      var products = this.service.products;
      return products ? products.filter(function (item) {
        return item.selected && !item.removed;
      }) : [];
    }

  };
}
"use strict";

{
  var toNumberArray = function toNumberArray(numbs) {
    if (angular.isArray(numbs) || !numbs) {
      return numbs;
    }

    return numbs.split(/,\s*/g).map(function (numb) {
      return +numb;
    });
  };

  angular.module("icsm.subtype", ['bw.paging']).directive("subtype", ['$rootScope', function ($rootScope) {
    return {
      templateUrl: "icsm/results/subtype.html",
      scope: {
        items: "=",
        mappings: "="
      },
      link: function link(scope) {
        var timer = null;
        scope.paging = {
          page: 1,
          pageSize: 20
        };
        scope.$on("filter.changed", function () {
          console.log("Filter changed - Subtype");
          scope.setPage(1, 20);
        });

        scope.setPage = function (page, pagesize) {
          var matchedItems = scope.items.filter(function (item) {
            return item.matched;
          });
          scope.data = matchedItems.slice(pagesize * (page - 1), page * pagesize);
        };

        scope.setPage(1, 20);

        scope.show = function (data) {
          var bbox = toNumberArray(data.bbox);
          $rootScope.$broadcast('icsm.bbox.draw', bbox);
        };

        scope.hide = function (data) {
          $rootScope.$broadcast('icsm.bbox.draw', null);
        };
      }
    };
  }]).filter("hasProducts", function () {
    return function (items) {
      return items.some(function (item) {
        return item.product;
      });
    };
  }).filter("hasTransformables", function () {
    return function (items) {
      return items.some(function (item) {
        return item.transformable;
      });
    };
  }).filter("productsSummary", function () {
    return function (items) {
      var count = items.filter(function (item) {
        return item.product;
      }).length;
      var response = " including ";

      switch (count) {
        case 1:
          response += "1 product";
          break;

        default:
          response += count + " products";
      }

      return response;
    };
  }).filter("productsCount", function () {
    return function (items) {
      return items ? items.filter(function (item) {
        return item.product;
      }).length : 0;
    };
  }).filter("transformablesCount", function () {
    return function (items) {
      return items ? items.filter(function (item) {
        return item.transformable;
      }).length : 0;
    };
  });
}
"use strict";

{
  var captured = function captured(twoDates) {
    if (!twoDates) {
      return twoDates;
    }

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

  var toNumberArray = function toNumberArray(numbs) {
    if (angular.isArray(numbs) || !numbs) {
      return numbs;
    }

    return numbs.split(/,\s*/g).map(function (numb) {
      return +numb;
    });
  };

  angular.module('icsm.unreleased', []).directive('icsmUnreleased', ['$rootScope', function ($rootScope) {
    return {
      templateUrl: "icsm/results/unreleased.html",
      scope: {
        types: "="
      },
      link: function link(scope) {
        console.log("Unrelease me!");

        scope.show = function (data) {
          var bbox = toNumberArray(data.bbox);
          $rootScope.$broadcast('icsm.bbox.draw', bbox);
        };

        scope.hide = function (data) {
          $rootScope.$broadcast('icsm.bbox.draw', null);
        };
      }
    };
  }]).directive('icsmProjectAbstract', ['listService', function (listService) {
    return {
      templateUrl: "icsm/results/abstractbutton.html",
      scope: {
        project: "="
      },
      link: function link(scope) {
        scope.item = {};
        scope.show = listService.hasMetadata(scope.item);

        scope.toggle = function () {
          scope.item.showAbstract = !scope.item.showAbstract;

          if (scope.item.showAbstract) {
            load();
          }
        };

        function load() {
          if (!scope.fetched) {
            scope.fetched = true;
            listService.getMetadata(scope.item).then(function (data) {
              scope.item.metadata = data;
            });
          }
        }
      }
    };
  }]).filter("captured", function () {
    return captured;
  }).filter("reverseDate", function () {
    return formatDate;
  });
}
"use strict";

{
  var transformTemplate = function transformTemplate(template, data) {
    var response = template;
    angular.forEach(data, function (value, key) {
      response = response.replace("{" + key + "}", encodeURIComponent(value));
    });
    return response;
  };

  var convertFlatToStructured = function convertFlatToStructured(flat) {
    var fields = ["file_url", "file_name", "project_name", "product", "metadata_id", "file_size", "bbox"]; // ["index_poly_name", "file_name", "file_url", "file_size", "file_last_modified", "bbox"]

    var response = {
      available_data: []
    };
    var available = response.available_data;
    var sourceMap = {};
    flat.forEach(function (dataset) {
      var item = {};
      fields.forEach(function (field) {
        if (typeof dataset[field] !== "undefined") {
          item[field] = dataset[field];
        }
      });
      var data = sourceMap[dataset.source];

      if (!data) {
        data = {
          source: dataset.source,
          downloadables: {}
        };
        sourceMap[dataset.source] = data;
        available.push(data);
      }

      var downloadable = data.downloadables[dataset.type];

      if (!downloadable) {
        downloadable = {};
        data.downloadables[dataset.type] = downloadable;
      }

      var group = downloadable[dataset.group];

      if (!group) {
        group = [];
        downloadable[dataset.group] = group;
      }

      group.push(item);
    });
    return response;
  };

  angular.module("elvis.reviewing", []).directive('icsmReview', ['$rootScope', '$uibModal', '$log', 'messageService', 'reviewService', function ($rootScope, $uibModal, $log, messageService, reviewService) {
    return {
      link: function link(scope, element) {
        var modalInstance;
        scope.data = reviewService.data; // TODO: Why is this here? What is trying to override data?

        scope.$watch("data", function (value, old) {
          if (old) {
            console.log("Why?", value);
            scope.data = reviewService.data;
          }
        });
        scope.$watch("data.reviewing", function (value) {
          if (value) {
            modalInstance = $uibModal.open({
              templateUrl: 'icsm/reviewing/reviewing.html',
              size: "lg",
              backdrop: "static",
              keyboard: false,
              controller: ['$scope', '$uibModalInstance', 'listService', 'products', 'vcRecaptchaService', function ($scope, $uibModalInstance, listService, products, vcRecaptchaService) {
                $scope.recaptchaKey = "6LfUrFsUAAAAAKu4EJY_FSi3zFXvWm60RDVknRHf";
                var selected = scope.selected = products.filter(function (product) {
                  return product.selected;
                });
                scope.derived = selected.filter(function (selection) {
                  return selection.product;
                });
                listService.getMappings().then(function (response) {
                  $scope.mappings = response;
                });

                $scope.heading = function (source) {
                  if (!$scope.mappings) return source;
                  var mapping = $scope.mappings[source];
                  return mapping.displayName ? mapping.displayName : source;
                };

                $scope.products = convertFlatToStructured(selected).available_data;

                $scope.accept = function () {
                  $uibModalInstance.close($scope.recaptchaResponse, $scope.products);
                };

                $scope.cancel = function () {
                  $uibModalInstance.close(null);
                };

                $scope.setWidgetId = function (widgetId) {
                  $scope.recaptchaId = widgetId;
                };

                $scope.setResponse = function (response) {
                  $scope.recaptchaResponse = response;
                };

                $scope.cbExpiration = function () {
                  vcRecaptchaService.reload($scope.recaptchaId);
                  $scope.recaptchaResponse = null;
                };
              }],
              resolve: {
                products: function products() {
                  return reviewService.products;
                }
              }
            });
            modalInstance.result.then(function (recaptchaResponse) {
              delete scope.data.recaptchaResponse;

              if (recaptchaResponse) {
                scope.data.recaptchaResponse = recaptchaResponse;
                reviewService.startExtract().then(function (response) {
                  messageService[response.status](response.message);
                  reviewService.removeRemoved();
                  scope.data.reviewing = false;
                });
              }

              reviewService.removeRemoved();
              scope.data.reviewing = false;
            }, function () {
              $log.info('Cancelled');
            });
          }
        });
      }
    };
  }]).directive('reviewIndustry', ["configService", "reviewService", function (configService, reviewService) {
    return {
      retrict: "AE",
      template: '<div class="input-group">' + '<span class="input-group-addon" style="width:6em" id="nedf-industry">Industry</span>' + '<select required="required" type="text" ng-options="ind.text for ind in industries" ng-model="data.industry" class="form-control" placeholder="Industry of interest for this data" aria-describedby="nedf-industry">' + '</select></div>',
      link: function link(scope) {
        scope.data = reviewService.data;
        configService.getConfig("industries").then(function (list) {
          scope.industries = list;
        });
      }
    };
  }]).directive("reviewEmail", ['reviewService', function (reviewService) {
    return {
      template: '<div class="input-group">' + '<span class="input-group-addon" style="width:6em" id="nedf-email">Email</span>' + '<input required="required" type="email" ng-model="data.email" class="form-control" placeholder="Email address to send download link" aria-describedby="nedf-email">' + '</div>',
      restrict: "AE",
      link: function link(scope, element) {
        scope.data = reviewService.data; //console.log("data" + scope.data);
      }
    };
  }]).filter('reviewProductsSelected', function () {
    return function (products) {
      return products.filter(function (product) {
        return product.selected;
      });
    };
  }).filter('reviewSumSize', function () {
    return function (products) {
      return products.reduce(function (sum, product) {
        return sum + (product.file_size ? +product.file_size : product.product ? 500000000 : 0);
      }, 0);
    };
  }).factory('reviewService', ['$http', '$q', 'clipService', 'configService', 'listService', 'persistService', function ($http, $q, clipService, configService, listService, persistService) {
    var EMAIL_KEY = "elvis_download_email";
    var INDUSTRY_KEY = "elvis_download_industry";
    var data = listService.data;
    var service = {
      get data() {
        return data;
      },

      set data(data) {
        console.log("What the hell!");
        data;
      },

      get products() {
        return listService.products;
      },

      startExtract: function startExtract() {
        this.setEmail(data.email);
        this.setIndustry(data.industry);
        return configService.getConfig("processing").then(function (config) {
          var clip = clipService.data.clip;
          console.log("We are processing files");
          return postFiles();

          function postFiles() {
            var postData = convertFlatToStructured(listService.products.filter(function (product) {
              return product.selected;
            }));
            postData.parameters = {
              polygon: clip.polygon,
              email: data.email,
              industry: data.industry.code,
              recaptcha: data.recaptchaResponse
            };

            if (data.outCoordSys) {
              postData.parameters.outCoordSys = data.outCoordSys.code;
            }

            if (data.outFormat) {
              postData.parameters.outFormat = data.outFormat.code;
            }

            listService.products.forEach(function (product) {
              product.selected = product.removed = false;
            });
            return $http({
              method: 'POST',
              url: config.postProcessingUrl,
              data: postData,
              headers: {
                "Content-Type": "application/json"
              }
            }).then(function (response) {
              return response.data;
            }, function (d) {
              return {
                status: "error",
                message: "Sorry but the service failed to respond. Try again later."
              };
            });
          }
        });
      },
      removeRemoved: function removeRemoved() {
        listService.products.forEach(function (product) {
          product.removed = false;
        });
      },
      setEmail: function setEmail(email) {
        this.data.email = email;
        persistService.setItem(EMAIL_KEY, email);
      },
      setIndustry: function setIndustry(industry) {
        this.data.industry = industry;

        if (industry && industry.code) {
          persistService.setItem(INDUSTRY_KEY, industry.code);
        }
      },
      clipProduct: function clipProduct() {}
    };
    persistService.getItem(EMAIL_KEY).then(function (value) {
      service.data.email = value;
    });
    persistService.getItem(INDUSTRY_KEY).then(function (code) {
      if (code) {
        configService.getConfig("industries").then(function (list) {
          service.data.industry = list.find(function (item) {
            return item.code === code;
          });
        });
      }
    });
    return service;
  }]);
}
"use strict";

{
  var SelectService = function SelectService($http, $q, $rootScope, $timeout, mapService, configService) {
    var LAYER_GROUP_KEY = "Search Layers",
        baseUrl = "icsm/resources/config/select.json",
        parameters = {
      text: "",
      daterange: {
        enabled: false,
        upper: null,
        lower: null
      },
      bbox: {
        fromMap: true,
        intersects: true,
        yMax: null,
        yMin: null,
        xMax: null,
        xMin: null
      },
      defaultKeywords: [],
      keywords: []
    },
        timeout,
        cache,
        allDocs = {},
        busy = false,
        layers = {},
        selectLayerGroup,
        normalLayerColor = "#ff7800",
        hilightLayerColor = 'darkblue',
        service = {
      getSelectCriteria: function getSelectCriteria() {
        return parameters;
      },
      getLayerGroup: function getLayerGroup() {
        // Prime the layer group
        if (!selectLayerGroup) {
          selectLayerGroup = mapService.getGroup(LAYER_GROUP_KEY);
        }

        return selectLayerGroup;
      },
      setKeywords: function setKeywords(keywords) {},
      setFilter: function setFilter(filter) {},
      refresh: function refresh() {},
      getDaterange: function getDaterange() {
        return parameters.daterange;
      },
      more: function more() {},
      _executeQuery: function _executeQuery() {
        // Give them the lot as they will want the criteria as well
        $http.get(baseUrl, {
          cache: true
        }).then(function (response) {
          service.getLayerGroup();
          var data = response.data;
          data.response.docs.forEach(function (dataset) {
            service._decorateDataset(dataset);

            if (dataset.type == "group") {
              dataset.docs.forEach(function (data) {
                service._decorateDataset(data);
              });
            }
          });
          $rootScope.$broadcast("select.facet.counts", data);
          $rootScope.$broadcast("select.results.received", data);
        });
      },
      createLayer: function createLayer(dataset, color) {
        var bbox = dataset.bbox,
            key = dataset.primaryId,
            parts,
            bounds,
            layer;
        layer = layers[key];

        if (!layer) {
          if (!bbox) {
            return null;
          }

          parts = bbox.split(" ");

          if (parts.length != 4) {
            return null;
          }

          if (!color) {
            color = normalLayerColor;
          }

          bounds = [[+parts[1], +parts[0]], [+parts[3], +parts[2]]]; // create a black rectangle

          layer = L.rectangle(bounds, {
            fill: false,
            color: "#000000",
            width: 3,
            clickable: false
          });
          layers[key] = layer;
        }

        this._decorateDataset(dataset);

        selectLayerGroup.addLayer(layer);
        return layer;
      },
      _decorateDataset: function _decorateDataset(dataset) {
        var layer = layers[dataset.primaryId];

        if (layer) {
          dataset.layer = layer;
          dataset.showLayer = true;
        } else {
          dataset.layer = null;
          dataset.showLayer = false; // Do we add the services to it?

          dataset.services = servicesFactory(dataset.dcUris);
          dataset.bounds = getBounds(dataset.bbox);
        }

        function getBounds(bbox) {
          var parts;

          if (!bbox) {
            return null;
          } else {
            parts = bbox.split(/\s/g);
            return {
              xMin: +parts[0],
              xMax: +parts[2],
              yMax: +parts[3],
              yMin: +parts[1]
            };
          }
        }
      },
      showWithin: function showWithin(datasets) {
        datasets.forEach(function (dataset) {
          var box = dataset.bbox,
              coords,
              xmin,
              ymin,
              xmax,
              ymax;

          if (!box) {
            service.removeLayer(dataset);
          } else {
            coords = box.split(" ");

            if (coords.length === 4 && within(+coords[0], +coords[1], +coords[2], +coords[3])) {
              // show
              service.createLayer(dataset);
            } else {
              // hide
              service.removeLayer(dataset);
            }
          }
        });

        function within(xmin, ymin, xmax, ymax) {
          var bbox = parameters.bbox;
          return xmin > bbox.xMin && xmax < bbox.xMax && ymin > bbox.yMin && ymax < bbox.yMax;
        }
      },
      toggle: function toggle(dataset) {
        if (dataset.showLayer) {
          this.removeLayer(dataset);
        } else {
          this.createLayer(dataset);
        }
      },
      toggleAll: function toggleAll(datasets) {
        var self = this,
            someNotShowing = datasets.some(function (dataset) {
          return !dataset.showLayer;
        });
        datasets.forEach(function (dataset) {
          if (someNotShowing) {
            if (!dataset.showLayer) {
              self.createLayer(dataset);
            }
          } else {
            if (dataset.showLayer) {
              self.removeLayer(dataset);
            }
          }
        });
        return !someNotShowing;
      },
      hideAll: function hideAll(datasets) {
        datasets.forEach(function (dataset) {
          if (dataset.showLayer) {
            service.removeLayer(dataset);
          }
        });
      },
      hilight: function hilight(layer) {
        layer.setStyle({
          color: hilightLayerColor
        });
      },
      lolight: function lolight(layer) {
        layer.setStyle({
          color: normalLayerColor
        });
      },
      removeLayer: function removeLayer(dataset) {
        var key = dataset.primaryId,
            layer = layers[key];

        if (layer) {
          selectLayerGroup.removeLayer(layer);
          delete layers[key];
        }

        this._decorateDataset(dataset);
      }
    };
    execute();
    return service;

    function execute() {
      $timeout(function () {
        service._executeQuery();
      }, 100);
    }
  };

  var servicesFactory = function servicesFactory(uris) {
    var protocols = {
      WCS: "OGC:WCS",
      WFS: "OGC:WFS",
      WMS: "OGC:WMS"
    };
    Service.prototype = {
      getUrl: function getUrl() {
        if (url) {
          if (url.indexOf("?") < 0) {
            return;
          } else {
            return url.substr(0, url.indexOf("?"));
          }
        }

        return null;
      }
    };

    function Services(uris) {
      this.uris = uris;
      this.container = {
        wcs: null,
        wms: null
      };

      if (uris) {
        this.services = uris.map(function (uri) {
          var service = new Service(uri);
          this.container.wcs = service.isWcs() ? service : this.container.wcs;
          this.container.wms = service.isWms() ? service : this.container.wms;
          return service;
        }.bind(this));
      } else {
        this.services = [];
      }

      this.hasWcs = function () {
        return this.container.wcs !== null;
      };

      this.hasWms = function () {
        return this.container.wms !== null;
      };

      this.getWcs = function () {
        return this.container.wcs;
      };

      this.getWms = function () {
        return this.container.wms;
      };

      this.remove = function () {
        this.services.forEach(function (service) {
          service.remove();
        });
      };
    }

    function Service(doc) {
      var xmlDoc = $(doc);
      this.protocol = xmlDoc.attr("protocol");
      this.url = xmlDoc.text();
      this.layerNames = xmlDoc.attr("layerNames");
      this.name = xmlDoc.attr("name");
      this.description = xmlDoc.attr("description");
      this.handlers = [];

      this.isWcs = function () {
        // console.log("Checking results:" + (this.protocol == protocols.WCS));
        return this.protocol == protocols.WCS;
      };

      this.isWfs = function () {
        return this.protocol == protocols.WFS;
      };

      this.isWms = function () {
        return this.protocol == protocols.WMS;
      };

      this.isSupported = function () {
        return typeof protocols[this.protocol] == "undefined";
      };

      this.addHandler = function (callback) {
        this.handlers.push(callback);
      };

      this.removeHandler = function (callback) {
        this.handlers.push(callback);
      };

      this.remove = function () {
        this.handlers.forEach(function (callback) {
          // They should all have a remove but you never know.
          if (this.callback.remove) {
            callback.remove(this);
          }
        }.bind(this));
        this.handlers = [];
      };
    }

    return new Services(uris);
  };

  angular.module("icsm.select.service", []).factory("selectService", SelectService);
  SelectService.$inject = ['$http', '$q', '$rootScope', '$timeout', 'mapService', 'configService'];
}
"use strict";

{
  var SelectCriteriaCtrl = function SelectCriteriaCtrl(selectService) {
    this.criteria = selectService.getSelectCriteria();

    this.refresh = function () {
      selectService.refresh();
    };
  };

  var SelectCtrl = function SelectCtrl($rootScope, configService, flashService, selectService) {
    var flasher,
        self = this;
    $rootScope.$on("select.results.received", function (event, data) {
      //console.log("Received response")
      flashService.remove(flasher);
      self.data = data;
    });
    configService.getConfig("facets").then(function (config) {
      this.hasKeywords = config && config.keywordMapped && config.keywordMapped.length > 0;
    }.bind(this));

    this.select = function () {
      flashService.remove(flasher);
      flasher = flashService.add("Selecting", 3000, true);
      selectService.setFilter(this.filter);
    };

    this.toggle = function (result) {
      selectService.toggle(result);
    };

    this.toggleAll = function () {
      selectService.toggleAll(this.data.response.docs);
    };

    this.showWithin = function () {
      selectService.showWithin(this.data.response.docs);
    };

    this.allShowing = function () {
      if (!this.data || !this.data.response) {
        return false;
      }

      return !this.data.response.docs.some(function (dataset) {
        return !dataset.showLayer;
      });
    };

    this.anyShowing = function () {
      if (!this.data || !this.data.response) {
        return false;
      }

      return this.data.response.docs.some(function (dataset) {
        return dataset.showLayer;
      });
    };

    this.hideAll = function () {
      selectService.hideAll(this.data.response.docs);
    };

    this.hilight = function (doc) {
      if (doc.layer) {
        selectService.hilight(doc.layer);
      }
    };

    this.lolight = function (doc) {
      if (doc.layer) {
        selectService.lolight(doc.layer);
      }
    };
  };

  angular.module("icsm.select", ['icsm.select.service']).controller("SelectCtrl", SelectCtrl).controller("SelectCriteriaCtrl", SelectCriteriaCtrl).directive("icsmSelect", [function () {
    return {
      templateUrl: "icsm/select/select.html",
      link: function link(scope, element, attrs) {//console.log("Hello select!");
      }
    };
  }]).directive("selectDoc", [function () {
    return {
      templateUrl: "icsm/select/doc.html",
      link: function link(scope, element, attrs) {//console.log("What's up doc!");
      }
    };
  }]).directive("selectGroup", [function () {
    return {
      templateUrl: "icsm/select/group.html",
      scope: {
        group: "="
      },
      link: function link(scope, element, attrs) {//console.log("What's up doc!");
      }
    };
  }])
  /**
   * Format the publication date
   */
  .filter("pubDate", function () {
    return function (string) {
      var date;

      if (string) {
        date = new Date(string);
        return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
      }

      return "-";
    };
  })
  /**
   * Format the array of authors
   */
  .filter("authors", function () {
    return function (auth) {
      if (auth) {
        return auth.join(", ");
      }

      return "-";
    };
  })
  /**
   * If the text is larger than a certain size truncate it and add some dots to the end.
   */
  .filter("truncate", function () {
    return function (text, length) {
      if (text && text.length > length - 3) {
        return text.substr(0, length - 3) + "...";
      }

      return text;
    };
  });
  SelectCriteriaCtrl.$inject = ["selectService"];
  SelectCtrl.$inject = ['$rootScope', 'configService', 'flashService', 'selectService'];
}
"use strict";

{
  angular.module("icsm.splash", []).directive('icsmSplash', ['$rootScope', '$uibModal', '$log', 'splashService', function ($rootScope, $uibModal, $log, splashService) {
    return {
      controller: ['$scope', 'splashService', function ($scope, splashService) {
        $scope.acceptedTerms = true;
        splashService.getReleaseNotes().then(function (messages) {
          $scope.releaseMessages = messages;
          $scope.acceptedTerms = splashService.hasViewedSplash();
        });
      }],
      link: function link(scope, element) {
        var modalInstance;
        scope.$watch("acceptedTerms", function (value) {
          if (value === false) {
            modalInstance = $uibModal.open({
              templateUrl: 'icsm/splash/splash.html',
              size: "lg",
              backdrop: "static",
              keyboard: false,
              controller: ['$scope', '$uibModalInstance', 'acceptedTerms', 'messages', function ($scope, $uibModalInstance, acceptedTerms, messages) {
                $scope.acceptedTerms = acceptedTerms;
                $scope.messages = messages;

                $scope.accept = function () {
                  $uibModalInstance.close(true);
                };
              }],
              resolve: {
                acceptedTerms: function acceptedTerms() {
                  return scope.acceptedTerms;
                },
                messages: function messages() {
                  return scope.releaseMessages;
                }
              }
            });
            modalInstance.result.then(function (acceptedTerms) {
              $log.info("Accepted terms");
              scope.acceptedTerms = acceptedTerms;
              splashService.setHasViewedSplash(acceptedTerms);
            }, function () {
              $log.info('Modal dismissed at: ' + new Date());
            });
          }
        });
        $rootScope.$on("logoutRequest", function () {
          userService.setAcceptedTerms(false);
        });
      }
    };
  }]).factory("splashService", ['$http', function ($http) {
    var VIEWED_SPLASH_KEY = "icsm.accepted.terms",
        releaseNotesUrl = "icsm/resources/service/releaseNotes";
    return {
      getReleaseNotes: function getReleaseNotes() {
        return $http({
          method: "GET",
          url: releaseNotesUrl + "?t=" + Date.now()
        }).then(function (result) {
          return result.data;
        });
      },
      hasViewedSplash: hasViewedSplash,
      setHasViewedSplash: setHasViewedSplash
    };

    function setHasViewedSplash(value) {
      if (value) {
        sessionStorage.setItem(VIEWED_SPLASH_KEY, true);
      } else {
        sessionStorage.removeItem(VIEWED_SPLASH_KEY);
      }
    }

    function hasViewedSplash() {
      return !!sessionStorage.getItem(VIEWED_SPLASH_KEY);
    }
  }]).filter("priorityColor", [function () {
    var map = {
      IMPORTANT: "red",
      HIGH: "blue",
      MEDIUM: "orange",
      LOW: "gray"
    };
    return function (priority) {
      if (priority in map) {
        return map[priority];
      }

      return "black";
    };
  }]).filter("wordLowerCamel", function () {
    return function (priority) {
      return priority.charAt(0) + priority.substr(1).toLowerCase();
    };
  }).filter("sortNotes", [function () {
    return function (messages) {
      if (!messages) {
        return;
      }

      var response = messages.slice(0).sort(function (prev, next) {
        if (prev.priority == next.priority) {
          return prev.lastUpdate == next.lastUpdate ? 0 : next.lastUpdate - prev.lastUpdate;
        } else {
          return prev.priority == "IMPORTANT" ? -11 : 1;
        }
      });
      return response;
    };
  }]);
}
"use strict";

{
  angular.module('icsm.state', []).directive("icsmStateToggle", ['downloadService', function (downloadService) {
    return {
      restrict: 'AE',
      template: '<button ng-click="toggle(false)" ng-disabled="state.show" class="btn btn-default" title="Start downlaod selection."><i class="fa fa-lg fa-object-group"></i></button>',
      link: function link(scope) {
        downloadService.data().then(function (data) {
          scope.state = data;
        });

        scope.toggle = function () {
          scope.state.show = !scope.state.show;
        };
      }
    };
  }]);
}
"use strict";

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

/**
 * This version relies on 0.0.4+ of explorer-path-server as it uses the URL for intersection on the artesian basin plus the actual KML
 */

/*!
 * Copyright 2015 Geoscience Australia (http://www.ga.gov.au/copyright.html)
 */

/**
 * This version relies on 0.0.4+ of explorer-path-server as it uses the URL for intersection on the artesian basin plus the actual KML
 */
{
  angular.module("temp.elevation", ['graph', 'explorer.crosshair', 'explorer.flasher', 'geo.map', 'geo.path']).directive("pathElevationPlot", ['$log', '$timeout', '$rootScope', '$filter', 'elevationService', 'crosshairService', function ($log, $timeout, $rootScope, $filter, elevationService, crosshairService) {
    var WIDTH = 1000,
        HEIGHT = 90,
        elevationStyle = {
      fill: "orange",
      fillOpacity: 0.4,
      stroke: "darkred",
      strokeWidth: 1.5
    },
        infoLoading = '<span><img alt="Waiting..." src="resources/img/tinyloader.gif" ng-show="message.spinner" style="position:relative;top:2px;" width="12"></img></span>';
    return {
      templateUrl: "icsm/tempelevation/elevation.html",
      scope: true,
      controller: ['$scope', function ($scope) {
        $scope.paths = [];
        $scope.config = {
          xLabel: "Distance: 3000m"
        };
        $rootScope.$on("elevation.plot.data", function (event, data) {
          $scope.length = data.length;
          $scope.geometry = data.geometry;
          $scope.config.xLabel = "Path length: " + $filter("length")(data.length, true);

          if ($scope.length && $scope.geometry) {
            elevationService.getElevation($scope.geometry, $scope.length).then(function (elevation) {
              // Keep a handle on it as we will generally build a collection after the first build
              $scope.elevation = {
                style: elevationStyle,
                data: elevation
              }; // Show the range.

              $scope.config.leftText = "Elevation Range: " + $filter("length")(d3.min(elevation, function (d) {
                return d.z;
              }), true) + " to " + $filter("length")(d3.max(elevation, function (d) {
                return d.z;
              }), true); // If we got here we always want to wipe out existing paths.

              $scope.paths = [$scope.elevation];
            });
          }
        });

        $scope.getInfoText = function () {
          if (!$scope.infoText) {
            $scope.infoText = infoLoading;
            elevationService.getInfoText().then(function (html) {
              $scope.infoText = html;
            });
          }
        };

        $scope.close = function () {
          $scope.paths = $scope.geometry = $scope.length = null;
        };
      }],
      link: function link(scope, element) {
        scope.graphClick = function (event) {
          if (event.position) {
            var point = event.position.points[0].point;
            elevationService.panToPoint(point);
            scope.point = point;
          }
        };

        scope.graphLeave = function (event) {
          scope.position = null;
          crosshairService.remove();
          $log.debug("Mouse left");

          if (scope.mapListener) {
            $log.info("offMapMove"); //featureSummaryService.offMapMove(scope.mapListener);
          }
        };

        scope.graphEnter = function (event) {
          $log.debug("Graph be entered");
        };

        scope.graphMove = function (event) {
          var point;
          scope.position = event.position;

          if (scope.position) {
            point = scope.position.point;
            window.eve = event;
            scope.position.markerLonlat = crosshairService.move(point);
          }

          $log.debug("Mouse moving...");
        };

        scope.$watch("geometry", processGeometry);

        function processGeometry() {
          if (scope.line) {
            scope.line = elevationService.pathHide(scope.line);
          }

          if (scope.geometry) {
            scope.line = elevationService.pathShow(scope.geometry);
          }
        }
      }
    };
  }]).directive('marsPanTo', ['$rootScope', 'mapService', function ($rootScope, mapService) {
    var DEFAULTS = {
      eventName: "elevation.plot.data",
      options: {
        paddingTopLeft: [50, 50],
        paddingBottomRight: [50, 250]
      }
    };
    return {
      restrict: 'AE',
      scope: {
        eventName: "=",
        options: "="
      },
      link: function link(scope) {
        angular.forEach(DEFAULTS, function (value, key) {
          if (typeof scope[key] == "undefined") {
            scope[key] = value;
          }
        });
        $rootScope.$on(scope.eventName, function (event, data) {
          var line = L.polyline(data.geometry);
          var bounds = line.getBounds();
          mapService.getMap().then(function (map) {
            map.fitBounds(bounds, scope.options);
          });
        });
      }
    };
  }]).provider("elevationService", function ConfigServiceProvider() {
    var pointCount = 500,
        elevationUrl = "service/path/elevation",
        waterTableUrl = "service/path/waterTable",
        artesianBasinKmlUrl = "service/artesianBasin/geometry/kml",
        intersectUrl = "service/artesianBasin/intersects",
        map,
        state = {
      isWaterTableShowing: false
    };

    this.setIntersectUrl = function (url) {
      intersectUrl = url;
    };

    this.setKmlUrl = function (url) {
      artesianBasinKmlUrl = url;
    };

    this.setElevationUrl = function (url) {
      elevationUrl = url;
    };

    this.setWaterTableUrl = function (url) {
      waterTableUrl = url;
    };

    this.$get = ['$log', 'httpData', '$q', 'mapService', 'flashService', function ($log, httpData, $q, mapService, flashService) {
      // We are safe doing this as it can't be triggered until the map is drawn anyway.
      mapService.getMap().then(function (olMap) {
        map = olMap;
      });
      var $elevation = {
        panToPoint: function panToPoint(point) {
          mapService.zoomTo(point.y, point.x);
        },
        getState: function getState() {
          return state;
        },
        getElevation: function getElevation(geometry) {
          flashService.add("Elevation service is down for maintenance.", 5000);
          return $q.when({});
        },
        getInfoText: function getInfoText() {
          return httpData.get("map/elevation/elevationInfo.html", {
            cache: true
          }).then(function (response) {
            return response.data;
          });
        },
        pathShow: function pathShow(latlngs) {
          var lineLayer = L.polyline(latlngs, {
            color: 'red',
            weight: 3,
            opacity: 0.8
          }).addTo(map);
          return lineLayer;
        },
        pathHide: function pathHide(lineLayer) {
          map.removeLayer(lineLayer);
          return null;
        }
      };
      return $elevation;
    }];
  });
}
L.Control.ComingSoon = L.Control.extend({
  _active: false,
  _map: null,
  includes: L.Mixin.Events,
  options: {
    position: 'topleft',
    className: 'fa fa-italic fa-rotate-270',
    modal: false
  },
  onAdd: function onAdd(map) {
    this._map = map;
    this._container = L.DomUtil.create('div', 'leaflet-zoom-box-control leaflet-bar');
    this._container.title = "Elevation along a path (coming soon)";
    var link = L.DomUtil.create('a', this.options.className, this._container);
    link.href = "#";
    L.DomEvent.on(this._container, 'dblclick', L.DomEvent.stop).on(this._container, 'click', L.DomEvent.stop).on(this._container, 'click', function () {
      this._active = !this._active;
      var newZoom,
          zoom = map.getZoom();

      if (zoom <= map.getMinZoom()) {
        return;
      }

      if (zoom < 10) {
        newZoom = zoom - 1;
      } else if (zoom < 13) {
        newZoom = zoom - 2;
      } else {
        newZoom = zoom - 3;
      }

      map.setZoom(newZoom);
    }, this);
    return this._container;
  },
  activate: function activate() {
    L.DomUtil.addClass(this._container, 'active');
  },
  deactivate: function deactivate() {
    L.DomUtil.removeClass(this._container, 'active');
    this._active = false;
  }
});

L.control.comingSoon = function (options) {
  return new L.Control.ComingSoon(options);
};
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function () { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var BaseStrategy = /*#__PURE__*/function () {
  function BaseStrategy($http) {
    _classCallCheck(this, BaseStrategy);

    this.http = $http;
    this.NO_METADATA = "Metadata";
    this.NO_METADATA_LINK = "Metadata supplied with download";
  }

  _createClass(BaseStrategy, [{
    key: "constructLink",
    value: function constructLink(item) {
      return item.metadata_url ? item.metadata_url : null;
    }
  }, {
    key: "hasMetadata",
    value: function hasMetadata(item) {
      return false;
    }
  }, {
    key: "requestMetadata",
    value: function requestMetadata(item) {
      var response = item.metadata_url ? this.NO_METADATA : this.NO_METADATA_LINK;
      return BaseStrategy.resolvedPromise({
        title: response
      });
    }
  }], [{
    key: "resolvedPromise",
    value: function resolvedPromise(data) {
      // Create a very poor man's promise for IE11 or anybody really. It'll work anywhere.
      var response = {
        then: function then(fn) {
          this.fn = fn;
        }
      };
      setTimeout(function () {
        if (response.fn) {
          response.fn(data);
        }
      }, 1);
      return response;
    }
  }, {
    key: "extractData",
    value: function extractData(wrapper) {
      var metadata = wrapper.MD_Metadata;
      var data = {};
      var node = metadata && metadata.identificationInfo && metadata.identificationInfo.MD_DataIdentification;
      var abstractNode = node;
      node = node && node.citation && node.citation.CI_Citation;
      node = node && node.title && node.title.CharacterString;

      if (node) {
        data.title = node.__text;

        var _abstract = abstractNode && abstractNode["abstract"] && abstractNode["abstract"].CharacterString && abstractNode["abstract"].CharacterString.__text;

        data["abstract"] = data.abstractText = _abstract;
      } else {
        data.title = _get(_getPrototypeOf(BaseStrategy), "NO_METADATA", this);
      }

      return data;
    }
  }]);

  return BaseStrategy;
}();

var UnknownStrategy = /*#__PURE__*/function (_BaseStrategy) {
  _inherits(UnknownStrategy, _BaseStrategy);

  var _super = _createSuper(UnknownStrategy);

  function UnknownStrategy(http) {
    _classCallCheck(this, UnknownStrategy);

    return _super.call(this, http);
  }

  return UnknownStrategy;
}(BaseStrategy);

var ActStrategy = /*#__PURE__*/function (_BaseStrategy2) {
  _inherits(ActStrategy, _BaseStrategy2);

  var _super2 = _createSuper(ActStrategy);

  function ActStrategy(http) {
    _classCallCheck(this, ActStrategy);

    return _super2.call(this, http);
  }

  return ActStrategy;
}(BaseStrategy);

var GaStrategy = /*#__PURE__*/function (_BaseStrategy3) {
  _inherits(GaStrategy, _BaseStrategy3);

  var _super3 = _createSuper(GaStrategy);

  function GaStrategy(http) {
    var _this;

    _classCallCheck(this, GaStrategy);

    _this = _super3.call(this, http); // https://ecat.ga.gov.au/geonetwork/srv/eng/xml.metadata.get?uuid=22be4b55-2465-4320-e053-10a3070a5236

    _this.GA_LINK_METADATA_TEMPLATE = 'https://ecat.ga.gov.au/geonetwork/srv/eng/search#!${uuid}';
    _this.GA_METADATA_TEMPLATE = 'https://ecat.ga.gov.au/geonetwork/srv/eng/xml.metadata.get?uuid=${uuid}';
    _this.UUID_REG_EX = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/;
    return _this;
  }

  _createClass(GaStrategy, [{
    key: "constructLink",
    value: function constructLink(item) {
      if (item.metadata_url) {
        return item.metadata_url;
      }

      var uuid = item.metadata_id;
      return uuid ? this.GA_LINK_METADATA_TEMPLATE.replace("${uuid}", uuid) : null;
    }
  }, {
    key: "hasMetadata",
    value: function hasMetadata(item) {
      return !!this.constructLink(item);
    }
  }, {
    key: "requestMetadata",
    value: function requestMetadata(item) {
      var _this2 = this;

      var uuid = item.metadata_id;
      var url = uuid ? "xml2js/" + this.GA_METADATA_TEMPLATE.replace("${uuid}", uuid) : null;

      if (url) {
        return this.http.get(url).then(function (response) {
          return BaseStrategy.extractData(response.data);
        }, function (err) {
          return {
            title: _this2.NO_METADATA
          };
        });
      } else {
        return BaseStrategy.resolvedPromise({
          title: this.NO_METADATA
        });
      }
    }
  }]);

  return GaStrategy;
}(BaseStrategy);

var EftfStrategy = /*#__PURE__*/function (_BaseStrategy4) {
  _inherits(EftfStrategy, _BaseStrategy4);

  var _super4 = _createSuper(EftfStrategy);

  function EftfStrategy(http) {
    _classCallCheck(this, EftfStrategy);

    return _super4.call(this, http);
  }

  _createClass(EftfStrategy, [{
    key: "constructLink",
    value: function constructLink(item) {
      return item.metadata_url;
    }
  }, {
    key: "requestMetadata",
    value: function requestMetadata(item) {
      return BaseStrategy.resolvedPromise({
        title: "View metadata in new page"
      });
    }
  }]);

  return EftfStrategy;
}(BaseStrategy);

var NswStrategy = /*#__PURE__*/function (_BaseStrategy5) {
  _inherits(NswStrategy, _BaseStrategy5);

  var _super5 = _createSuper(NswStrategy);

  function NswStrategy(http) {
    var _this3;

    _classCallCheck(this, NswStrategy);

    _this3 = _super5.call(this, http);
    _this3.NSW_METADATA_TEMPLATE = "https://s3-ap-southeast-2.amazonaws.com/nsw.elvis/z5${zone}/Metadata/";
    return _this3;
  }

  _createClass(NswStrategy, [{
    key: "constructLink",
    value: function constructLink(item) {
      var filename = item.file_name;
      var re = /\_5\d\_/;
      var index = filename.search(re);
      var zone = 6;
      var url = this.NSW_METADATA_TEMPLATE;

      if (index !== -1) {
        zone = filename.substr(index + 2, 1);
      }

      return url.replace("${zone}", zone) + filename.replace(".zip", "_Metadata.html");
    }
  }, {
    key: "hasMetadata",
    value: function hasMetadata(item) {
      return true;
    }
  }, {
    key: "requestMetadata",
    value: function requestMetadata(item) {
      var _this4 = this;

      var filename = item.file_name;
      var re = /\_5\d\_/;
      var index = filename.search(re);
      var zone = 6;
      var url = this.NSW_METADATA_TEMPLATE;

      if (index !== -1) {
        zone = filename.substr(index + 2, 1);
      }

      url = "xml2js/" + url.replace("${zone}", zone) + filename.replace(".zip", "_Metadata.xml");
      return this.http.get(url).then(function (response) {
        return BaseStrategy.extractData(response.data);
      }, function (err) {
        return {
          title: _get(_getPrototypeOf(NswStrategy.prototype), "NO_METADATA", _this4)
        };
      });
    }
  }]);

  return NswStrategy;
}(BaseStrategy);

var NtStrategy = /*#__PURE__*/function (_BaseStrategy6) {
  _inherits(NtStrategy, _BaseStrategy6);

  var _super6 = _createSuper(NtStrategy);

  function NtStrategy(http) {
    _classCallCheck(this, NtStrategy);

    return _super6.call(this, http);
  }

  return NtStrategy;
}(BaseStrategy);

var QldStrategy = /*#__PURE__*/function (_BaseStrategy7) {
  _inherits(QldStrategy, _BaseStrategy7);

  var _super7 = _createSuper(QldStrategy);

  function QldStrategy(http) {
    var _this5;

    _classCallCheck(this, QldStrategy);

    _this5 = _super7.call(this, http);
    _this5.XML_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={metadata_id}&f=xml";
    _this5.QLD_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={EB442CAB-D714-40D8-82C2-A01CA4661324}&f=xml";
    _this5.QLD_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={EB442CAB-D714-40D8-82C2-A01CA4661324}";
    _this5.FRASER_COAST_METADATA_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/rest/document?id={E8CEF5BA-A1B7-4DE5-A703-8161FD9BD3CF}&f=xml";
    _this5.FRASER_COAST_HTML_TEMPLATE = "http://qldspatial.information.qld.gov.au/catalogue/custom/detail.page?fid={E8CEF5BA-A1B7-4DE5-A703-8161FD9BD3CF}";
    _this5.FRASER_COAST_BOUNDS = [152.331, -26.003, 153.370, -24.692]; //  Extracted from metadata XML

    return _this5;
  }

  _createClass(QldStrategy, [{
    key: "constructLink",
    value: function constructLink(item) {
      if (item.metadata_url) {
        return item.metadata_url;
      }

      var bbox = item.bbox.split(",").map(function (val) {
        return parseFloat(val.trim());
      });

      if (bbox[0] >= this.FRASER_COAST_BOUNDS[0] && bbox[1] >= this.FRASER_COAST_BOUNDS[1] && bbox[2] <= this.FRASER_COAST_BOUNDS[2] && bbox[0] >= this.FRASER_COAST_BOUNDS[3]) {
        return this.FRASER_COAST_HTML_TEMPLATE;
      } else {
        return this.QLD_HTML_TEMPLATE;
      }
    }
  }, {
    key: "hasMetadata",
    value: function hasMetadata(item) {
      return true;
    }
  }, {
    key: "requestMetadata",
    value: function requestMetadata(item) {
      var _this6 = this;

      var url;

      if (item.metadata_id) {
        url = this.XML_METADATA_TEMPLATE.replace("metadata_id", item.metadata_id);
      } else {
        url = this.QLD_METADATA_TEMPLATE;
        var bbox = item.bbox.split(",").map(function (val) {
          return parseFloat(val.trim());
        });

        if (bbox[0] >= this.FRASER_COAST_BOUNDS[0] && bbox[1] >= this.FRASER_COAST_BOUNDS[1] && bbox[2] <= this.FRASER_COAST_BOUNDS[2] && bbox[0] >= this.FRASER_COAST_BOUNDS[3]) {
          url = this.FRASER_COAST_METADATA_TEMPLATE;
        }
      }

      return this.http.get("xml2js/" + url).then(function (response) {
        return BaseStrategy.extractData(response.data);
      }, function (err) {
        return {
          title: _get(_getPrototypeOf(QldStrategy.prototype), "NO_METADATA", _this6)
        };
      });
    }
  }]);

  return QldStrategy;
}(BaseStrategy);

var SaStrategy = /*#__PURE__*/function (_BaseStrategy8) {
  _inherits(SaStrategy, _BaseStrategy8);

  var _super8 = _createSuper(SaStrategy);

  function SaStrategy(http) {
    _classCallCheck(this, SaStrategy);

    return _super8.call(this, http);
  }

  return SaStrategy;
}(BaseStrategy);

var TasStrategy = /*#__PURE__*/function (_BaseStrategy9) {
  _inherits(TasStrategy, _BaseStrategy9);

  var _super9 = _createSuper(TasStrategy);

  function TasStrategy(http) {
    _classCallCheck(this, TasStrategy);

    return _super9.call(this, http);
  }

  return TasStrategy;
}(BaseStrategy);

var VicStrategy = /*#__PURE__*/function (_BaseStrategy10) {
  _inherits(VicStrategy, _BaseStrategy10);

  var _super10 = _createSuper(VicStrategy);

  function VicStrategy(http) {
    _classCallCheck(this, VicStrategy);

    return _super10.call(this, http);
  }

  return VicStrategy;
}(BaseStrategy);

var WaStrategy = /*#__PURE__*/function (_BaseStrategy11) {
  _inherits(WaStrategy, _BaseStrategy11);

  var _super11 = _createSuper(WaStrategy);

  function WaStrategy(http) {
    _classCallCheck(this, WaStrategy);

    return _super11.call(this, http);
  }

  return WaStrategy;
}(BaseStrategy);

var Strategies = /*#__PURE__*/function () {
  function Strategies(http) {
    _classCallCheck(this, Strategies);

    var unknown = this.unknown = new UnknownStrategy();
    this.strategies = [{
      name: "NSW Government",
      strategy: new NswStrategy(http)
    }, {
      name: "VIC Government",
      strategy: unknown // new VicStrategy(http)

    }, {
      name: "SA Government",
      strategy: unknown // new SaStrategy(http),

    }, {
      name: "WA Government",
      strategy: unknown // new WaStrategy(http),

    }, {
      name: "QLD Government",
      strategy: new QldStrategy(http)
    }, {
      name: "ACT Government",
      strategy: unknown // new ActStrategy(http)

    }, {
      name: "NT Government",
      strategy: unknown // new NtStrategy(http)

    }, {
      name: "TAS Government",
      strategy: unknown // new TasStrategy(http)

    }, {
      name: "Geoscience Australia",
      strategy: new GaStrategy(http)
    }, {
      name: "Exploring for the Future",
      strategy: new EftfStrategy(http)
    }];
  }

  _createClass(Strategies, [{
    key: "strategy",
    value: function strategy(name) {
      var metadata = this.strategies.find(function (unit) {
        return unit.name && name.indexOf(unit.name) === 0;
      });
      return metadata ? metadata.strategy : this.unknown;
    }
  }]);

  return Strategies;
}();
"use strict";

{
  angular.module('icsm.themes', [])
  /**
     *
     * Override the original mars user.
     *
       */
  .directive('icsmThemes', ['themesService', function (themesService) {
    return {
      restrict: 'AE',
      templateUrl: 'icsm/themes/themes.html',
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
  }]).controller('themesCtrl', ['themesService', function (themesService) {
    this.service = themesService;
  }]).filter('themesFilter', function () {
    return function (features, theme) {
      var response = []; // Give 'em all if they haven't set a theme.

      if (!theme) {
        return features;
      }

      if (features) {
        features.forEach(function (feature) {
          if (feature.themes) {
            if (feature.themes.some(function (name) {
              return name == theme.key;
            })) {
              response.push(feature);
            }
          }
        });
      }

      return response;
    };
  }).factory('themesService', ['$q', 'configService', 'storageService', function ($q, configService, storageService) {
    var THEME_PERSIST_KEY = 'icsm.current.theme';
    var DEFAULT_THEME = "All";
    var waiting = [];
    var self = this;
    this.themes = [];
    this.theme = null;
    storageService.getItem(THEME_PERSIST_KEY).then(function (value) {
      if (!value) {
        value = DEFAULT_THEME;
      }

      configService.getConfig('themes').then(function (themes) {
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
      return configService.getConfig('themes');
    };

    this.setTheme = function (key) {
      this.theme = this.themes[key];
      storageService.setItem(THEME_PERSIST_KEY, key);
    };

    return this;
  }]);
}
"use strict";

{
  angular.module("icsm.transect", []).provider("transectService", function () {
    var diagonal = 500,
        layers = {},
        ptElevationUrl,
        extent = {
      lngMin: 112.99986111100009,
      lngMax: 153.999861113351,
      latMin: -44.0001389004617,
      latMax: -10.00013890099995
    };

    this.extent = function (newExtent) {
      extent.lngMin = angular.isUndefined(newExtent.lngMin) ? extent.lngMin : newExtent.lngMin;
      extent.lngMax = angular.isUndefined(newExtent.lngMax) ? extent.lngMax : newExtent.lngMax;
      extent.latMin = angular.isUndefined(newExtent.latMin) ? extent.latMin : newExtent.latMin;
      extent.latMax = angular.isUndefined(newExtent.latMax) ? extent.latMax : newExtent.latMax;
    };

    this.setServiceUrl = function (name, url) {
      name = name.toLowerCase();
      layers[name] = {
        urlTemplate: url
      };
      if (name === "elevation") ptElevationUrl = url.replace(/{height}|{width}/g, "1");
    };

    function calcSides(diagonal, ar) {
      // x * x + ar * ar * x * x = diagonal * diagonal
      // (1 + ar * ar) * x * x = diagonal * diagonal
      // x * x = diagonal * diagonal / (1 + ar * ar)
      var y = Math.sqrt(diagonal * diagonal / (1 + ar * ar));
      return {
        y: Math.ceil(y),
        x: Math.ceil(y * ar)
      };
    }

    this.$get = ['$q', function ($q) {
      return {
        getElevation: function getElevation(geometry, buffer) {
          return this.getServiceData("elevation", geometry, buffer);
        },
        getServiceData: function getServiceData(name, geometry, buffer) {
          var feature = Exp.Util.toGeoJSONFeature(geometry),
              bbox = turf.extent(feature),
              response = {
            type: "FeatureCollection",
            features: []
          },
              lngMin = bbox[0],
              latMin = bbox[1],
              lngMax = bbox[2],
              latMax = bbox[3]; // Sanity check for service url

          name = name.toLowerCase();
          var svcUrl = layers[name] && layers[name].urlTemplate;
          if (!svcUrl) return $q.when(response); // Sanity check for coordinates

          lngMax = lngMax > lngMin ? lngMax : lngMin + 0.0001;
          latMax = latMax > latMin ? latMax : latMin + 0.0001;
          var dx = lngMax - lngMin,
              dy = latMax - latMin;
          if (!buffer) buffer = 0;
          latMin = latMin - buffer * dy;
          latMax = latMax + buffer * dy;
          lngMin = lngMin - buffer * dx;
          lngMax = lngMax + buffer * dx;
          var xy = calcSides(diagonal, dx / dy),
              kiloms = turf.lineDistance(feature, "kilometers"),
              terrainLoader = new TerrainLoader(),
              deferred = $q.defer();
          svcUrl = svcUrl.replace("{bbox}", lngMin + "," + latMin + "," + lngMax + "," + latMax).replace(/{width}/g, "" + Math.ceil(xy.x)).replace(/{height}/g, "" + Math.ceil(xy.y));
          terrainLoader.load(svcUrl, function (loaded) {
            //                            console.log("width: " + xy.x + ", height: " + xy.y + "calculated cells = " + (xy.x * xy.y) + " loaded length = " + loaded.length);
            var delta = kiloms / (diagonal - 1);

            for (var i = 0; i < diagonal; i++) {
              var distance = i * delta;
              var deltaFeature = turf.along(feature, distance, "kilometers"),
                  height = toHeight(deltaFeature.geometry.coordinates);
              deltaFeature.properties.distance = distance;
              ;

              if (height > -32767) {
                deltaFeature.geometry.coordinates.push(height);
                response.features.push(deltaFeature);
              }
            }

            deferred.resolve(response);

            function toHeight(coord) {
              var x = coord[0],
                  y = coord[1],
                  zeroX = lngMin,
                  zeroY = latMax,
                  cellY = Math.round((zeroY - y) / dy * (xy.y - 1)),
                  cellX = Math.round((x - zeroX) / dx * (xy.x - 1)),
                  index = cellY * xy.x + cellX; // console.log("Cell x = " + cellX + ", y = " + cellY + " Index = " + index + ", value = " + loaded[index]);

              return loaded[index];
            }
          }, function (error) {
            console.log("Failed to load transect data for " + name);
            deferred.reject(error);
          });
          return deferred.promise;
        },
        isServiceDataAvailable: function isServiceDataAvailable(name) {
          return layers[name] && layers[name].urlTemplate;
        },
        getElevationAtPoint: function getElevationAtPoint(latlng) {
          var lng = latlng.lng,
              lat = latlng.lat;
          if (lat < extent.latMin || lat > extent.latMax || lng < extent.lngMin || lng > extent.lngMax) return $q.when(null);
          var bbox = [lng - 0.000001, lat - 0.000001, lng + 0.000001, lat + 0.000001];
          var deferred = $q.defer();
          new TerrainLoader().load(ptElevationUrl.replace("{bbox}", bbox.join(",")), function (elev) {
            deferred.resolve(elev);
          }, function (error) {
            console.log("Error, probably out of bounds");
          });
          return deferred.promise;
        }
      };
    }];
  });
}
"use strict";

{
  angular.module("icsm.toolbar", []).directive("elevationToolbar", [function () {
    return {
      restrict: "AE",
      templateUrl: "icsm/toolbar/toolbar.html",
      controller: 'toolbarLinksCtrl',
      transclude: true
    };
  }]).controller("toolbarLinksCtrl", ["$scope", "configService", function ($scope, configService) {
    var self = this;
    configService.getConfig().then(function (config) {
      self.links = config.toolbarLinks;
    });
    $scope.item = "";

    $scope.toggleItem = function (item) {
      $scope.item = $scope.item === item ? "" : item;
    };
  }]);
}
"use strict";

{
  var DownloadCtrl = function DownloadCtrl(downloadService) {
    downloadService.data().then(function (data) {
      this.data = data;
    }.bind(this));

    this.remove = function () {
      downloadService.clear();
    };

    this.changeEmail = function (email) {
      downloadService.setEmail(email);
    };
  };

  var DownloadService = function DownloadService($http, $q, $rootScope, mapService, storageService) {
    var key = "download_email",
        downloadLayerGroup = "Download Layers",
        mapState = {
      zoom: null,
      center: null,
      layer: null
    },
        _data = null,
        service = {
      getLayerGroup: function getLayerGroup() {
        return mapService.getGroup(downloadLayerGroup);
      },
      setState: function setState(data) {
        if (data) {
          prepare();
        } else {
          restore();
        }

        function prepare() {
          var bounds = [[data.bounds.yMin, data.bounds.xMin], [data.bounds.yMax, data.bounds.xMax]];

          if (mapState.layer) {
            mapService.getGroup(downloadLayerGroup).removeLayer(mapState.layer);
          }
        }

        function restore(map) {
          if (mapState.layer) {
            mapService.clearGroup(downloadLayerGroup);
            mapState.layer = null;
          }
        }
      },
      decorate: function decorate() {
        var item = _data.item;
        _data.item.download = true;

        if (!item.processsing) {
          item.processing = {
            clip: {
              xMax: null,
              xMin: null,
              yMax: null,
              yMin: null
            }
          };
        }
      },
      setEmail: function setEmail(email) {
        storageService.setItem(key, email);
      },
      getEmail: function getEmail() {
        return storageService.getItem(key).then(function (value) {
          _data.email = value;
          return value;
        });
      },
      data: function data() {
        if (_data) {
          return $q.when(_data);
        }

        return $http.get('icsm/resources/config/icsm.json').then(function (response) {
          _data = response.data;
          service.decorate();
          return _data;
        });
      }
    };
    return service;
  };

  angular.module("icsm.view", []).directive("icsmView", ['downloadService', function (downloadService) {
    return {
      templateUrl: "icsm/view/view.html",
      controller: "DownloadCtrl",
      link: function link(scope, element) {
        downloadService.data().then(function (data) {
          scope.data = data;
        });
        scope.$watch("data.item", function (item, old) {
          if (item || old) {
            downloadService.setState(item);
          }
        });
      }
    };
  }]).controller("DownloadCtrl", DownloadCtrl).factory("downloadService", DownloadService);
  DownloadCtrl.$inject = ["downloadService"];
  DownloadService.$inject = ['$http', '$q', '$rootScope', 'mapService', 'storageService'];
}
angular.module('icsm.templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('icsm/app/app.html','<div>\r\n\t<!-- BEGIN: Sticky Header -->\r\n\t<div explorer-header style="z-index:1"\r\n\t\t\tclass="navbar navbar-default navbar-fixed-top"\r\n\t\t\theading="\'Elevation\'"\r\n\t\t\theadingtitle="\'ICSM\'"\r\n\t\t\tbreadcrumbs="[{name:\'ICSM\', title: \'Reload Elevation\', url: \'.\'}]"\r\n\t\t\thelptitle="\'Get help about Elevation\'"\r\n\t\t\thelpalttext="\'Get help about Elevation\'">\r\n\t</div>\r\n\t<!-- END: Sticky Header -->\r\n\r\n\t<!-- Messages go here. They are fixed to the tab bar. -->\r\n\t<div explorer-messages class="marsMessages noPrint"></div>\r\n\t<icsm-panes data="root.data" default-item="download"></icsm-panes>\r\n</div>');
$templateCache.put('icsm/coverage/popup.html','<span class="coverage" ng-class="state.show ? \'transitioned-down\' : \'transitioned-up\'">\r\n   <div style="padding-bottom:15px" class="coverage-off">\r\n      <button class="undecorated coverage-unstick" ng-click="hide()" style="float:right" title="Hide layer selections">X</button>\r\n   </div>\r\n   <div ng-repeat="layer in state.layers" class="coverage-layer" tooltip-placement="left"\r\n         uib-tooltip="Hint: To bring this layer to the top turn it off then on. The last clicked layer is always on top.">\r\n      <input type="checkbox" ng-checked="layer.visible" ng-click="toggleVisibility(layer)"></input>\r\n      <span ng-click="toggleVisibility(layer)">\r\n         <span class="coverage-title">{{layer.name}}</span><br/>\r\n         <img style="width:100px" ng-src="{{layer.coverage.thumb}}"></img>\r\n      </span>\r\n      <div class="pull-right">\r\n         <div style="width: 110px" ng-repeat="type in layer.coverage.types">\r\n            <span class="coverage-legend-color" ng-style="{\'background-color\':type.color}"></span>\r\n            {{type.name}}\r\n         </div>\r\n      </div>\r\n   </div>\r\n</span>');
$templateCache.put('icsm/coverage/trigger.html','<button ng-click="toggle()" type="button" class="map-tool-toggle-btn" title="Select views of coverage, view legends and summaries of the coverage layers">\r\n      <span class="panel-sm">Layers</span>\r\n      <img src="icsm/resources/img/layers-16.png">\r\n</button>');
$templateCache.put('icsm/clip/clip.html','<div class="well well-sm">\r\n   <div class="container-fluid">\r\n      <div class="row">\r\n         <div class="col-md-10">\r\n            <strong style="font-size:120%">Select area by:</strong>\r\n            <button ng-click="initiateDraw()" style="position:relative" ng-disable="client.drawing" tooltip-placement="right"\r\n               uib-tooltip="Drawing a bounding box. On enabling, click on the map and drag diagonally"\r\n               class="clip-btn">\r\n               <img style="height:24px;" src="icsm/resources/img/draw_rectangle.png"></img>\r\n               <div></div>\r\n            </button>\r\n            <button ng-click="initiatePolygon()" style="position:relative" ng-disable="client.drawing" tooltip-placement="right"\r\n               uib-tooltip="Drawing a polygon. On enabling, click vertices on the map, click on the first vertex to complete the loop."\r\n               class="clip-btn">\r\n               <img style="height:26px;" src="icsm/resources/img/draw_polygon.png"></img>\r\n               <div></div>\r\n            </button>\r\n            <button ng-click="typing = !typing" style="position:relative" tooltip-placement="right"\r\n               uib-tooltip="Type coordinates of a bounding box. Restricted to maximum of 2.25 square degrees."\r\n               class="clip-btn">\r\n               <i class="fa fa-keyboard-o fa-2x" aria-hidden="true"></i>\r\n               <div></div>\r\n            </button>\r\n         </div>\r\n         <div class="col-md-2">\r\n            <button style="float:right" ng-click="showInfo = !showInfo" tooltip-placement="left"\r\n               uib-tooltip="Information." class="btn btn-primary btn-default"><i class="fa fa-info"></i></button>\r\n            <exp-info title="Selecting an area" show-close="true"\r\n               style="width:450px;position:fixed;top:230px;right:40px" is-open="showInfo">\r\n               <icsm-info-bbox>\r\n         </div>\r\n         </exp-info>\r\n      </div>\r\n   </div>\r\n   <div class="row" ng-hide="typing || (!clip.xMin && clip.xMin !== 0) || oversize" style="padding-top:7px;">\r\n         <div class="col-md-12 ng-binding" ng-if="clip.type == \'polygon\'">\r\n            Polygon bounded by:\r\n            {{clip.xMin | number : 4}}\xB0 west,\r\n            {{clip.yMax | number : 4}}\xB0 north,\r\n            {{clip.xMax | number : 4}}\xB0 east,\r\n            {{clip.yMin | number : 4}}\xB0 south\r\n         </div>\r\n         <div class="col-md-12 ng-binding" ng-if="clip.type == \'bbox\'">\r\n            Selected bounds:\r\n            {{clip.xMin | number : 4}}\xB0 west,\r\n            {{clip.yMax | number : 4}}\xB0 north,\r\n            {{clip.xMax | number : 4}}\xB0 east,\r\n            {{clip.yMin | number : 4}}\xB0 south\r\n         </div>\r\n   </div>\r\n   <clip-modal title="Define search area" show-close="true" style="width:480px;position:fixed;top:110px;right:80px"\r\n      is-open="typing">\r\n      <icsm-manual-clip></icsm-manual-clip>\r\n   </clip-modal>\r\n</div>');
$templateCache.put('icsm/clip/infobbox.html','<div class="">\r\n\t<strong style="font-size:120%">Select an area of interest.</strong>\r\n   By hitting one of the "Draw" buttons an area on the map can be selected with the mouse by drawing a bounding box, drawing a polygon or manually typing in the minimum and maximum of latitude and longitude. Hover over the buttons to see\r\n\tmore information.\r\n\t<br/>\r\n   Clicking one of the "Draw" buttons again allows replacing a previous area selection. <br/>\r\n   <strong>Notes:</strong>\r\n   <ul>\r\n      <li>The data does not cover all of Australia.</li>\r\n      <li>Restrict a search area to below 1.5 degrees square. eg 2x0.75 or 1x1.5</li>\r\n   </ul>\r\n\t<p style="padding-top:5px"><strong>Hint:</strong> If the map has focus, you can use the arrow keys to pan the map.\r\n\t\tYou can zoom in and out using the mouse wheel or the "+" and "-" map control on the top left of the map. If you\r\n\t\tdon\'t like the position of your drawn area, hit the one of the "Draw" buttons to draw a new search area.\r\n\t</p>\r\n</div>');
$templateCache.put('icsm/clip/manual.html','<div class="container-fluid" style="padding-top:7px">\r\n   <div class="row">\r\n      <div class="col-md-3"> </div>\r\n      <div class="col-md-8">\r\n         <div style="font-weight:bold;width:3.5em;display:inline-block">Y Max:</div>\r\n         <span>\r\n            <input type="text" style="width:6em" ng-model="yMax" ng-change="check()"></input>\r\n         </span>\r\n      </div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-6">\r\n         <div style="font-weight:bold;width:3.5em;display:inline-block">X Min:</div>\r\n         <span>\r\n            <input type="text" style="width:6em" ng-model="xMin" ng-change="check()"></input>\r\n         </span>\r\n      </div>\r\n      <div class="col-md-6">\r\n         <div style="font-weight:bold;width:3.5em;display:inline-block">X Max:</div>\r\n         <span>\r\n            <input type="text" style="width:6em" ng-model="xMax" ng-change="check()"></input>\r\n         </span>\r\n      </div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-offset-3 col-md-5">\r\n         <div style="font-weight:bold;width:3.5em;display:inline-block">Y Min:</div>\r\n         <span>\r\n            <input type="text" style="width:6em" ng-model="yMin" ng-change="check()"></input>\r\n         </span>\r\n      </div>\r\n      <div class="col-md-4">\r\n         <button style="float:right" ng-disabled="!xMin || !xMax || !yMin || !yMax || isNan(xMin) || isNan(xMax) || isNan(yMin) || isNan(yMax) || (+xMin) === (+xMax) || (+yMin) === (+yMax)" class="btn btn-primary btn-default" ng-click="search()">Search</button>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/clip/modal.html','<div class="clipmodal" ng-show="isOpen">\r\n\t<div class="clipmodal-inner">\r\n      <h3 ng-show="title" class="clipmodal-title">\r\n\t\t  \t<span  ng-bind="title"></span>\r\n\t\t  \t<span ng-show="showClose" class="pull-right">\r\n\t\t \t\t<button type="button" class="undecorated" ng-click="isOpen = false"><i class="fa fa-close"></i></button>\r\n\t\t\t</span>\r\n\t\t</h3>\r\n      <div class="clipmodal-content" ng-transclude></div>\r\n\t</div>\r\n</div>');
$templateCache.put('icsm/contributors/contributors.html','<span class="contributors" \r\n      ng-class="(contributors.show || contributors.ingroup || contributors.stick) ? \'transitioned-down\' : \'transitioned-up\'">\r\n   <button class="undecorated contributors-unstick" ng-click="unstick()" style="float:right">X</button>\r\n   <div ng-repeat="contributor in contributors.orgs | activeContributors" style="text-align:center">\r\n      <a ng-href="{{contributor.href}}" name="contributors{{$index}}" title="{{contributor.title}}" target="_blank">\r\n         <img ng-src="{{contributor.image}}" alt="{{contributor.title}}" class="contributor-logo" ng-class="contributor.class"></img>\r\n      </a>\r\n   </div>\r\n</span>');
$templateCache.put('icsm/contributors/show.html','<a class="contributors-link" title="View contributors list."\r\n      ng-click="toggleStick()" href="#contributors0">Contributors</a>');
$templateCache.put('icsm/glossary/glossary.html','<div ng-controller="GlossaryCtrl as glossary">\r\n   <div style="position:relative;padding:5px;padding-left:10px;">\r\n      <div class="panel" style="padding:5px;">\r\n         <p style="text-align: left; margin: 10px; font-size: 14px;">\r\n\t         <strong>Glossary</strong>\r\n         </p>\r\n\r\n         <div class="panel-body">\r\n            <table class="table table-striped">\r\n               <thead>\r\n                  <tr>\r\n                     <th>Term</th>\r\n                     <th>Definition</th>\r\n                  </tr>\r\n               </thead>\r\n               <tbody>\r\n                  <tr ng-repeat="term in glossary.terms">\r\n                     <td>{{term.term}}</td>\r\n                     <td>{{term.definition}}</td>\r\n                  </tr>\r\n               </tbody>\r\n            </table>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/header/header.html','<div class="container-full common-header" style="padding-right:10px; padding-left:10px">\r\n   <div class="navbar-collapse collapse ga-header-collapse">\r\n      <ul class="nav navbar-nav">\r\n         <li class="hidden-xs">\r\n            <a href="https://www.icsm.gov.au/" target="_blank" class="icsm-logo"\r\n               style="margin-top: -4px;display:inline-block;">\r\n               <img alt="ICSM - ANZLIC Committee on Surveying &amp; Mapping" class="header-logo"\r\n                  src="icsm/resources/img/icsm-logo-sml.gif">\r\n            </a>\r\n            <a href="/">\r\n               <h1 class="applicationTitle">{{heading}}</h1>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class="nav navbar-nav navbar-right nav-icons">\r\n         <li role="menuitem" style="padding-right:10px;position: relative;top: -3px;">\r\n            <span class="altthemes-container">\r\n               <span>\r\n                  <a title="Location INformation Knowledge platform (LINK)" href="http://fsdf.org.au/" target="_blank">\r\n                     <img alt="FSDF" src="icsm/resources/img/FSDFimagev4.0.png" style="height: 66px">\r\n                  </a>\r\n               </span>\r\n            </span>\r\n         </li>\r\n         <li common-navigation role="menuitem" current="current" style="padding-right:10px"></li>\r\n         <li mars-version-display role="menuitem"></li>\r\n         <li style="width:10px"></li>\r\n      </ul>\r\n   </div>\r\n   <!--/.nav-collapse -->\r\n</div>\r\n<div class="contributorsLink" style="position: absolute; right:7px; bottom:15px">\r\n   <icsm-contributors-link></icsm-contributors-link>\r\n</div>\r\n<!-- Strap -->\r\n<div class="row">\r\n   <div class="col-md-12">\r\n      <div class="strap-blue">\r\n      </div>\r\n      <div class="strap-white">\r\n      </div>\r\n      <div class="strap-red">\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/help/faqs.html','<p style="text-align: left; margin: 10px; font-size: 14px;">\r\n   <strong>FAQS</strong>\r\n</p>\r\n\r\n<h5 ng-repeat="faq in faqs"><button type="button" class="undecorated" ng-click="focus(faq.key)">{{faq.question}}</button></h5>\r\n<hr/>\r\n<div class="row" ng-repeat="faq in faqs">\r\n   <div class="col-md-12">\r\n      <h5 tabindex="0" id="faqs_{{faq.key}}">{{faq.question}}</h5>\r\n      <span ng-bind-html="faq.answer"></span>\r\n      <hr/>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/help/help.html','<p style="text-align: left; margin: 10px; font-size: 14px;">\r\n\t<strong>Help</strong>\r\n</p>\r\n\r\n<div class="panel-body" ng-controller="HelpCtrl as help">\r\n\tThe steps to get data!\r\n\t<ol>\r\n\t\t<li>Define area of interest</li>\r\n\t\t<li>Select datasets</li>\r\n\t\t<li>Confirm selections</li>\r\n\t\t<li>Enter email address and industry</li>\r\n\t\t<li>Start extract</li>\r\n\t</ol>\r\n\tOne or more emails will be sent to you on completion of the data extract(s) with a link to your data.\r\n   <hr>\r\n\t<icsm-faqs faqs="help.faqs" ></icsm-faqs>\r\n</div>');
$templateCache.put('icsm/imagery/launch.html','<button type="button" class="undecorated" title="View preview of imagery" ng-click="preview()" ng-if="show">\r\n\t<i class="fa fa-lg fa-eye"></i>\r\n</button>');
$templateCache.put('icsm/panes/panes.html','<div class="mapContainer" class="col-md-12" style="padding-right:0"  ng-attr-style="right:{{right.width}}">\r\n   <span common-baselayer-control class="baselayer-slider" max-zoom="16" title="Satellite to Topography bias on base map."></span>\r\n   <div class="panesMapContainer" geo-map configuration="data.map">\r\n      <geo-extent></geo-extent>\r\n      <icsm-layerswitch></icsm-layerswitch>\r\n   </div>\r\n   <div class="base-layer-controller">\r\n      <div geo-draw data="data.map.drawOptions" line-event="elevation.plot.data" rectangle-event="bounds.drawn" polygon-event="polygon.drawn"></div>\r\n   </div>\r\n   <restrict-pan bounds="data.map.position.bounds"></restrict-pan>\r\n</div>\r\n');
$templateCache.put('icsm/panes/tabs.html','<!-- tabs go here -->\r\n<div id="panesTabsContainer" class="paneRotateTabs" style="opacity:0.9" ng-style="{\'right\' : contentLeft +\'px\'}">\r\n\r\n   <div class="paneTabItem" style="width:60px; opacity:0">\r\n\r\n   </div>\r\n   <div class="paneTabItem" ng-class="{\'bold\': view == \'download\'}" ng-click="setView(\'download\')">\r\n      <button class="undecorated">Datasets Download</button>\r\n   </div>\r\n   <!--\r\n\t<div class="paneTabItem" ng-class="{\'bold\': view == \'search\'}" ng-click="setView(\'search\')">\r\n\t\t<button class="undecorated">Search</button>\r\n\t</div>\r\n\t<div class="paneTabItem" ng-class="{\'bold\': view == \'maps\'}" ng-click="setView(\'maps\')">\r\n\t\t<button class="undecorated">Layers</button>\r\n\t</div>\r\n   -->\r\n   <div class="paneTabItem" ng-class="{\'bold\': view == \'downloader\'}" ng-click="setView(\'downloader\')">\r\n      <button class="undecorated">Products Download</button>\r\n   </div>\r\n   <div class="paneTabItem" ng-class="{\'bold\': view == \'glossary\'}" ng-click="setView(\'glossary\')">\r\n      <button class="undecorated">Glossary</button>\r\n   </div>\r\n   <div class="paneTabItem" ng-class="{\'bold\': view == \'help\'}" ng-click="setView(\'help\')">\r\n      <button class="undecorated">Help</button>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/message/message.html','<div class="well well-sm mess-container" ng-show="message.type && message.text"\r\n   ng-class="{\'mess-error\': message.type == \'error\', \'mess-warn\': message.type == \'warn\', \'mess-info\': (message.type == \'info\' || message.type == \'wait\')}">\r\n   <i class="fa fa-spinner fa-spin fa-fw" aria-hidden="true" ng-if="message.type == \'wait\'"></i>\r\n   <span>{{message.text}}</span>\r\n</div>');
$templateCache.put('icsm/products/download.html','<div class="well" ng-show="item.showDownload">\r\n\r\n   <div class="well">\r\n      <div ng-show="processing.validClip" class="product-restrict">\r\n         <span class="product-label">Bounds:</span> {{processing.clip.xMin|number : 4}}&deg; west, {{processing.clip.yMax|number : 4}}&deg; north, {{processing.clip.xMax|number\r\n         : 4}}&deg; east, {{processing.clip.yMin|number : 4}}&deg; south\r\n\r\n         <div ng-show="processing.message" class="product-warning">\r\n            {{processing.message}}\r\n         </div>\r\n      </div>\r\n      <product-projection processing="processing"></product-projection>\r\n      <br/>\r\n      <product-formats processing="processing"></product-formats>\r\n      <br/>\r\n      <product-email processing="processing"></product-email>\r\n   </div>\r\n   <product-download-submit processing="processing" item="item"></product-download-submit>\r\n</div>');
$templateCache.put('icsm/products/email.html','<div class="input-group">\r\n      <span class="input-group-addon" id="nedf-email">Email</span>\r\n      <input required="required" type="email" ng-model="processing.email" class="form-control" placeholder="Email address to send download link">\r\n   </div>\r\n');
$templateCache.put('icsm/products/formats.html','<div class="row">\r\n      <div class="col-md-4">\r\n         <label for="geoprocessOutputFormat">\r\n                  Output Format\r\n               </label>\r\n      </div>\r\n      <div class="col-md-8">\r\n         <select id="geoprocessOutputFormat" style="width:95%" ng-model="processing.outFormat" ng-options="opt.value for opt in config.outFormat track by opt.code"></select>\r\n      </div>\r\n   </div>');
$templateCache.put('icsm/products/projection.html','<div class="row">\r\n   <div class="col-md-4">\r\n      <label for="geoprocessOutCoordSys">\r\n                  Coordinate System\r\n               </label>\r\n   </div>\r\n   <div class="col-md-8">\r\n      <select id="geoprocessOutCoordSys" style="width:95%" ng-model="processing.outCoordSys" ng-options="opt.value for opt in config.outCoordSys | productIntersect : processing.clip track by opt.code"></select>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/products/submit.html','<div class="well" style="padding-bottom:2px">\r\n   <div class="row">\r\n      <div class="col-md-6" style="padding-top:7px">\r\n         <div class="progress">\r\n            <div class="progress-bar" role="progressbar" aria-valuenow="{{processing.percentComplete}}" aria-valuemin="0" aria-valuemax="100"\r\n               style="width: {{processing.percentComplete}}%;">\r\n               <span class="sr-only">60% Complete</span>\r\n            </div>\r\n         </div>\r\n      </div>\r\n      <div class="col-md-4" style="padding-top:7px">\r\n         <span style="padding-right:10px" uib-tooltip="Draw a valid area to extract data." tooltip-placement="left">\r\n            <i class="fa fa-scissors fa-2x" ng-class="{\'product-valid\': processing.validClipSize, \'product-invalid\': !processing.validClipSize }"></i>\r\n         </span>\r\n         <span style="padding-right:10px" uib-tooltip="Select a valid coordinate system for area." tooltip-placement="left">\r\n            <i class="fa fa-file-video-o fa-2x" ng-class="{\'product-valid\': processing.validProjection, \'product-invalid\': !processing.validProjection}"></i>\r\n         </span>\r\n         <span style="padding-right:10px" uib-tooltip="Select a valid download format." tooltip-placement="left">\r\n            <i class="fa fa-files-o fa-2x" ng-class="{\'product-valid\': processing.validFormat, \'product-invalid\': !processing.validFormat}"></i>\r\n         </span>\r\n         <span style="padding-right:10px" uib-tooltip="Provide an email address." tooltip-placement="left">\r\n            <i class="fa fa-envelope fa-2x" ng-class="{\'product-valid\': processing.validEmail, \'product-invalid\': !processing.validEmail}"></i>\r\n         </span>\r\n      </div>\r\n      <div class="col-md-2">\r\n         <button class="btn btn-primary pull-right" ng-disabled="!processing.valid" ng-click="submit()">Submit</button>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/preview/preview.html','<div class="preview-container" ng-if="previewData">\r\n   <div class="preview-blocker" ng-click="clear()"></div>\r\n\r\n   <div style="position:absolute; right: 10px; z-index: 1; top:20px">\r\n      <div class="pull-right">\r\n         <button type="button" class="btn btn-primary" ng-click="clear()" autofocus>Hide</button>\r\n      </div>\r\n   </div>\r\n   <img width="600" class="preview-image" ng-src="{{previewData.url}}"></img>\r\n</div>');
$templateCache.put('icsm/results/abstractbutton.html','<button ng-show="show" type="button" class="undecorated" title="View full title and abstract of this dataset" ng-click="toggle()">\r\n\t<i class="fa fa-lg" ng-class="{\'fa-caret-down active\':item.showAbstract, \'fa-caret-right\':!item.showAbstract}"></i>\r\n</button>');
$templateCache.put('icsm/results/abstracttooltip.html','<div>\r\n{{item.metadata.title? item.metadata.title: \'Loading...\'}}\r\n</div>');
$templateCache.put('icsm/results/continue.html','<div class="continue-container" ng-show="ctrl.selected.length">\r\n   <div class="warn-limit alert-danger" ng-show="ctrl.selectedSize > limit">\r\n      There is a {{limit | fileSize}} limit per request.<br/>\r\n      Remove some selections or decrease the size of the selected area.\r\n   </div>\r\n   <button ng-disabled="ctrl.selectedSize > limit" class="btn btn-primary" ng-click="ctrl.review()">Download {{ctrl.selected.length | number}} selected datasets... (Approx: {{ctrl.selectedSize | fileSize}})</button>\r\n</div>\r\n\r\n');
$templateCache.put('icsm/results/orgheading.html','<h5>\r\n   <img ng-src="{{mappings[org.source].image}}" ng-attr-style="height:{{mappings[org.source].height}}px"></img>\r\n      <strong>{{heading()}}</strong> (Showing {{org.downloadables | countMatchedDownloadables | number:0}} of {{org.downloadables\t| countDownloadables | number:0}})\r\n</h5>');
$templateCache.put('icsm/results/results.html','<div ng-show="!list || !list.length">\r\n   <div class="alert alert-warning" role="alert">\r\n      <strong>Select an area</strong> to find datasets within.</div>\r\n</div>\r\n\r\n<div ng-show="list.length" class="results-list">\r\n   <div class="row">\r\n      <div class="col-md-12" uib-tooltip="Number of intersecting or very near datasets to your area of interest.">\r\n         <h4 style="display:inline-block; padding-left:7px">Found {{products.length | number:0}} datasets</h4>\r\n      </div>\r\n   </div>\r\n   <div class="panel panel-default" style="margin-bottom: 5px; margin-top: 0;">\r\n      <div class="panel-body" style="float:clear">\r\n         <span class="filter-text" style="float:left;width:50%">\r\n            <div class="input-group input-group-sm">\r\n               <span class="input-group-addon" id="names1">Filter:</span>\r\n               <input type="text" ng-model="filters.filter" class="form-control" ng-change="update()" placeholder="Filter names" aria-describedby="names1">\r\n            </div>\r\n         </span>\r\n         <span class="filter-type" style="padding:10px; float:right">\r\n            <span class="listTypeLabel">Filter by type:</span>\r\n            <span ng-repeat="type in filters.types" class="listType">\r\n               <input type="checkbox" ng-model="type.selected" ng-change="update()" />\r\n               <span uib-tooltip="{{type.description}}">{{type.label}}</span>\r\n            </span>\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div ng-repeat="available in list" class="well" style="padding-left:4px;padding-right:4px" ng-show="list.someMatches(available)"\r\n      ng-controller="listCtrl as list">\r\n      <icsm-org-heading org="available" mappings="mappings"></icsm-org-heading>\r\n      <div>\r\n         <div class="listRow" ng-class-odd="\'listEven\'" ng-repeat="(typeKey, types) in available.downloadables | allowedTypes" ng-show="types | hasTypeMatches">\r\n            <span>\r\n               <h5>{{typeKey}}</h5>\r\n            </span>\r\n\r\n            <div ng-if="typeKey === \'Unreleased Data\'">\r\n               <icsm-unreleased types="types">\r\n            </div>\r\n            <div ng-if="typeKey !== \'Unreleased Data\'">\r\n               <div ng-repeat="(key, items) in types" ng-show="(items | countMatchedItems) != 0">\r\n                  <div>\r\n                     <h5>\r\n                        <button ng-click="list.checkChildren(items)" style="width:7em" class="btn btn-xs btn-default">\r\n                           <span ng-show="!list.childrenChecked(items)">Select all</span>\r\n                           <span ng-show="list.childrenChecked(items)">Deselect all</span>\r\n                        </button>\r\n                        <span uib-tooltip="{{filter.types[key].description}}">{{key}} (Showing {{items | countMatchedItems | number:0}} of {{items.length | number:0}})</span>\r\n\r\n\r\n                        <button class="pull-right undecorated" ng-click="expansions[available.source + \'_\' + key] = !expansions[available.source + \'_\' + key]">\r\n                           [{{expansions[available.source + \'_\' + key]?"hide ":"show "}} list]\r\n                        </button>\r\n                     </h5>\r\n                  </div>\r\n                  <div ng-show="expansions[available.source + \'_\' + key]">\r\n                     <subtype items="items" mappings="mappings" show="show" hide="hide"></subtype>\r\n                     <div style="text-align:right">\r\n                        <button class="undecorated" ng-click="expansions[available.source + \'_\' + key] = false">[hide list]</button>\r\n                     </div>\r\n                  </div>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/results/subtype.html','<div ng-show="(items | matchedItems).length > paging.pageSize"\r\n   paging page="paging.page" page-size="paging.pageSize"\r\n   total="(items | matchedItems).length"\r\n   paging-action="setPage(page, pageSize)">\r\n</div>\r\n<div>\r\n   <div ng-repeat="item in data" icsm-abstract-hover item="item">\r\n      <div tooltip-append-to-body="true" uib-tooltip-template="\'icsm/results/abstracttooltip.html\'" tooltip-popup-delay="400" data-ng-mouseenter="show(item)"\r\n         data-ng-mouseleave="hide(item)">\r\n         <input type="checkbox" ng-model="item.selected" />\r\n         <icsm-abstract item="item"></icsm-abstract>\r\n         <common-cc version="mappings[item.source].ccLicence"></common-cc>\r\n         <launch-image item="item" ng-if="item.thumb_url"></launch-image>\r\n         <span class="listItem" item="item" icsm-abstract-link></span>\r\n         <span ng-show="item.file_size" style="float:right;padding-top:3px">({{item.file_size | fileSize}})</span>\r\n         <span ng-show="item.product" style="float:right;padding-top:3px" title="Product size will depend on size of chosen area, data coverage and resolution. An email will be sent after the extraction giving the exact size of the extracted data and a link to the product.">(Product &lt; 500MB)</span>\r\n      </div>\r\n      <div ng-show="item.showAbstract" class="well">\r\n         <span ng-show="!item.metadata">\r\n            <i class="fa fa-spinner fa-spin fa-lg fa-fw"></i>\r\n            <span>Loading metadata...</span>\r\n         </span>\r\n         <div ng-show="item.metadata.abstract">\r\n            <strong>{{item.metadata.title}}</strong> -\r\n            <span class="icsm-abstract-body" ng-bind-html="item.metadata.abstractText"></span>\r\n         </div>\r\n         <div ng-show="!item.metadata.abstract">\r\n            <i class="fa fa-lg fa-exclamation-triangle" style="color:orange"></i>\r\n            Can\'t show abstract for this dataset.\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/results/unreleased.html','<div ng-repeat="(key, items) in types" ng-show="(items | countMatchedItems) != 0">\r\n   <div style="padding-left:8px">\r\n      <h5>\r\n         <span uib-tooltip="{{filter.types[key].description}}">{{key}} (Showing {{items | countMatchedItems | number:0}} of {{items.length | number:0}})</span>\r\n\r\n         <button class="pull-right undecorated" ng-click="expansions[\'unreleased_\' + items[0].source + \'_\' + key] = !expansions[\'unreleased_\' + items[0].source + \'_\' + key]">\r\n            [{{expansions[\'unreleased_\' + items[0].source + \'_\' + key]?"hide ":"show "}} list]\r\n         </button>\r\n      </h5>\r\n   </div>\r\n   <div ng-show="expansions[\'unreleased_\' + items[0].source + \'_\' + key]">\r\n      <div ng-repeat="item in items | matchedItems" icsm-abstract-hover item="item">\r\n         <div tooltip-append-to-body="true" uib-tooltip-template="\'icsm/results/abstracttooltip.html\'" tooltip-popup-delay="400" data-ng-mouseenter="show(item)"\r\n            data-ng-mouseleave="hide(item)" style="padding-left:8px;">\r\n            <icsm-abstract item="item"></icsm-abstract>\r\n            <button type="button" class="undecorated" disabled="disabled" title="Licence details pending release.">\r\n               <i class="fa fa-lg fa-gavel"></i>\r\n            </button>\r\n            <span class="listItem" name="project_name" item="item" icsm-abstract-link></span>\r\n            <span ng-show="item.file_size" style="float:right;padding-top:3px">({{item.file_size | fileSize}})</span>\r\n         </div>\r\n         <div ng-show="item.showAbstract" class="well" style="margin-bottom:0px">\r\n            <span ng-show="!item.metadata">\r\n               <i class="fa fa-spinner fa-spin fa-lg fa-fw"></i>\r\n               <span>Loading metadata...</span>\r\n            </span>\r\n            <div ng-show="item.metadata.abstract">\r\n               <strong>{{item.metadata.title}}</strong> -\r\n               <span class="icsm-abstract-body" ng-bind-html="item.metadata.abstractText"></span>\r\n            </div>\r\n            <div ng-show="!item.metadata.abstract">\r\n               <i class="fa fa-lg fa-exclamation-triangle" style="color:orange"></i>\r\n               There is no abstract available for this dataset.\r\n            </div>\r\n         </div>\r\n         <div style="padding-left:12px">\r\n            <div>\r\n               <strong style="width:7em">Captured: </strong>{{item.captured | captured}}\r\n            </div>\r\n            <div ng-if="item.available_date">\r\n               <strong style="width:7em">Available: </strong>{{item.available_date | reverseDate}}\r\n            </div>\r\n            <div>\r\n               <strong style="width:7em">Contact: </strong>\r\n               <a href="mailTo:{{item.contact}}">{{item.contact}}</a>\r\n            </div>\r\n         </div>\r\n      </div>\r\n\r\n      <div style="text-align:right">\r\n         <button class="undecorated" ng-click="expansions[\'unreleased_\' + items[0].source + \'_\' + key] = false">[hide list]</button>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/reviewing/reviewing.html','<div class="modal-header">\r\n   <h3 class="modal-title splash">Download datasets by providing email address and start extract</h3>\r\n</div>\r\n<div class="modal-body" id="accept" ng-form exp-enter="accept()" icsm-splash-modal style="width: 100%; margin-left: auto; margin-right: auto;">\r\n   <div class="row bg-warning" ng-show="noneSelected(products)">\r\n      <div class="col-md-2">\r\n         <button type="button" style="float:right" class="btn btn-primary" ng-click="cancel()">Close</button>\r\n      </div>\r\n   </div>\r\n   <div ng-controller="listCtrl as list">\r\n      <div class="row">\r\n         <div class="col-md-12">\r\n            <strong>\r\n               {{list.selected.length}} Selected Datasets\r\n               <span ng-show="list.selectedSize">(Approx: {{list.selectedSize | fileSize}})</span>\r\n            </strong>\r\n         </div>\r\n      </div>\r\n   </div>\r\n   <div ng-repeat="org in products">\r\n      <h5>\r\n         <img ng-src="{{mappings[org.source].image}}" ng-attr-style="height:{{mappings[org.source].height}}px"></img>\r\n         <strong>{{heading(org.source)}}</strong>\r\n      </h5>\r\n      <div style="padding-left:10px" ng-repeat="(key, subGroup) in org.downloadables">\r\n         <h5>{{key}}</h5>\r\n         <div style="padding-left:10px;" ng-repeat="(name, items) in subGroup">\r\n            <h5 title="Clipped product using coordinate System: {{data.outCoordSys.value}}, Output Format: {{data.outFormat.value}}">\r\n               {{name}}\r\n               <span style="padding-left:25px;font-size:90%">\r\n                  {{items.length | number :0}} items\r\n                  <span ng-if="items | hasProducts">{{items | productsSummary}}</span>\r\n                  totalling {{items | reviewSumSize | fileSize}}</span>\r\n            </h5>\r\n         </div>\r\n      </div>\r\n\r\n   </div>\r\n\r\n   <div ng-controller="listCtrl as list">\r\n      <div ng-if="list.selected | hasTransformables" class="well" style="padding:7px">\r\n         <h5 style="margin-top:4px">{{list.selected | transformablesCount}} item(s) are downloads which you can elect to transform into a different coordinate system and file format</h5>\r\n         <span products-dialog>\r\n            <product-projection processing="data"></product-projection>\r\n            <product-formats processing="data"></product-formats>\r\n         </span>\r\n      </div>\r\n   </div>\r\n\r\n   <div class="row reviewing-divider">\r\n      <div class="col-md-12" style="padding-bottom: 8px">\r\n         <div review-industry></div>\r\n      </div>\r\n      <div class="col-md-12">\r\n         <div review-email></div>\r\n      </div>\r\n   </div>\r\n   <div class="row" ng-controller="listCtrl as list">\r\n      <div class="col-md-8">\r\n         <strong>Email notification</strong> The extract of data can take some time. By providing an email address we will be able\r\n         to notify you when the job is complete. The email will provide a link to the extracted data which will be packaged\r\n         up as a single compressed file.\r\n\r\n         <div\r\n            vc-recaptcha\r\n            theme="\'light\'"\r\n            key="recaptchaKey"\r\n            on-create="setWidgetId(widgetId)"\r\n            on-success="setResponse(response)"\r\n            on-expire="cbExpiration()"></div>\r\n      </div>\r\n      <div class="col-md-4">\r\n         <div class="pull-right" style="padding:8px;">\r\n            <button type="button" class="btn btn-primary" ng-click="accept()" ng-disabled="!data.industry || !data.email || !list.selected.length || !recaptchaResponse">Start extract of datasets\r\n            </button>\r\n            <button type="button" class="btn btn-primary" ng-click="cancel()">Cancel</button>\r\n         </div>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/select/doc.html','<div ng-class-odd="\'odd\'" ng-class-even="\'even\'" ng-mouseleave="select.lolight(doc)" ng-mouseenter="select.hilight(doc)">\r\n\t<span ng-class="{ellipsis:!expanded}" tooltip-enable="!expanded" style="width:100%;display:inline-block;"\r\n\t\t\ttooltip-class="selectAbstractTooltip" tooltip="{{doc.abstract | truncate : 250}}" tooltip-placement="bottom">\r\n\t\t<button type="button" class="undecorated" ng-click="expanded = !expanded" title="Click to see more about this dataset">\r\n\t\t\t<i class="fa pad-right fa-lg" ng-class="{\'fa-caret-down\':expanded,\'fa-caret-right\':(!expanded)}"></i>\r\n\t\t</button>\r\n\t\t<download-add item="doc" group="group"></download-add>\r\n\t\t<icsm-wms data="doc"></icsm-wms>\r\n\t\t<icsm-bbox data="doc" ng-if="doc.showExtent"></icsm-bbox>\r\n\t\t<a href="https://ecat.ga.gov.au/geonetwork/srv/eng/search#!{{doc.primaryId}}" target="_blank" ><strong>{{doc.title}}</strong></a>\r\n\t</span>\r\n\t<span ng-class="{ellipsis:!expanded}" style="width:100%;display:inline-block;padding-right:15px;">\r\n\t\t{{doc.abstract}}\r\n\t</span>\r\n\t<div ng-show="expanded" style="padding-bottom: 5px;">\r\n\t\t<h5>Keywords</h5>\r\n\t\t<div>\r\n\t\t\t<span class="badge" ng-repeat="keyword in doc.keywords track by $index">{{keyword}}</span>\r\n\t\t</div>\r\n\t</div>\r\n</div>');
$templateCache.put('icsm/select/group.html','<div class="panel panel-default" style="margin-bottom:-5px;" >\r\n\t<div class="panel-heading"><icsm-wms data="group"></icsm-wms> <strong>{{group.title}}</strong></div>\r\n\t<div class="panel-body">\r\n   \t\t<div ng-repeat="doc in group.docs">\r\n   \t\t\t<div select-doc doc="doc" group="group"></div>\r\n\t\t</div>\r\n\t</div>\r\n</div>\r\n');
$templateCache.put('icsm/select/select.html','<div>\r\n\t<div style="position:relative;padding:5px;padding-left:10px;" ng-controller="SelectCtrl as select" class="scrollPanel">\r\n\t\t<div class="panel panel-default" style="margin-bottom:-5px">\r\n  \t\t\t<div class="panel-heading">\r\n  \t\t\t\t<h3 class="panel-title">Available datasets</h3>\r\n  \t\t\t</div>\r\n  \t\t\t<div class="panel-body">\r\n\t\t\t\t<div ng-repeat="doc in select.data.response.docs" style="padding-bottom:7px">\r\n\t\t\t\t\t<div select-doc ng-if="doc.type == \'dataset\'" doc="doc"></div>\r\n\t\t\t\t\t<select-group ng-if="doc.type == \'group\'" group="doc"></select-group>\r\n\t\t\t\t</div>\r\n  \t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>');
$templateCache.put('icsm/side-panel/side-panel-left.html','<div class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-left" style="width: {{left.width}}px;" ng-class="{\'cbp-spmenu-open\': left.active}">\r\n    <a href="" title="Close panel" ng-click="closeLeft()" style="z-index: 1200">\r\n        <span class="glyphicon glyphicon-chevron-left pull-right"></span>\r\n    </a>\r\n    <div ng-show="left.active === \'legend\'" class="left-side-menu-container">\r\n        <legend url="\'img/AustralianTopogaphyLegend.png\'" title="\'Map Legend\'"></legend>\r\n    </div>\r\n</div>');
$templateCache.put('icsm/side-panel/side-panel-right.html','<div class="cbp-spmenu cbp-spmenu-vertical cbp-spmenu-right noPrint" ng-attr-style="width:{{right.width}}" ng-class="{\'cbp-spmenu-open\': right.active}">\r\n    <a href="" title="Close panel" ng-click="closePanel()" style="z-index: 1">\r\n        <span class="glyphicon glyphicon-chevron-right pull-left"></span>\r\n    </a>\r\n\r\n    <div class="right-side-menu-container" ng-show="right.active === \'download\'" icsm-view></div>\r\n    <div class="right-side-menu-container" ng-show="right.active === \'maps\'" icsm-maps></div>\r\n    <div class="right-side-menu-container" ng-show="right.active === \'glossary\'" icsm-glossary></div>\r\n    <div class="right-side-menu-container" ng-show="right.active === \'help\'" icsm-help></div>\r\n    <panel-close-on-event only-on="search" event-name="clear.button.fired"></panel-close-on-event>\r\n</div>\r\n');
$templateCache.put('icsm/splash/splash.html','<div class="modal-header">\r\n   <h3 class="modal-title splash">Elevation - Foundation Spatial Data</h3>\r\n</div>\r\n<div class="modal-body" id="accept" ng-form exp-enter="accept()" icsm-splash-modal style="width: 100%; margin-left: auto; margin-right: auto;">\r\n\t<div>\r\n\t\t<p>\r\n\t\t\tHere you can download point cloud and elevation datasets sourced from jurisdictions.\r\n\t\t</p>\r\n\t\t<p>\r\n\t\t\t<a href="http://www.ga.gov.au/topographic-mapping/digital-elevation-data.html" target="_blank">Find out more on our Elevation page.</a>\r\n\t\t</p>\r\n\t\t<p>\r\n         Data can be downloaded at <strong>no charge</strong> but note that there is a <strong>15GB limit per request</strong> (please check the file size before you download your files).\r\n\t\t</p>\r\n\t\t<p>\r\n\t\t\t<a href="http://opentopo.sdsc.edu/gridsphere/gridsphere?cid=contributeframeportlet&gs_action=listTools" target="_blank">Click here for Free GIS Tools.</a>\r\n\t\t</p>\r\n      <h5>How to use</h5>\r\n      <p>\r\n         <ul>\r\n            <li>Pan and zoom the map to your area of interest,</li>\r\n            <li>Click on one of the "Select area by..." buttons to define your area of interest,\r\n               <ul>\r\n                  <li>\r\n                        <img style="height:26px;padding-right:10px" src="icsm/resources/img/draw_rectangle.png">Drawing a bounding box. On enabling, click on the map and drag diagonally. There is a limit of roughly 2 square degrees or 200 square km.\r\n                  </li>\r\n                  <li>\r\n                     <img style="height:26px;padding-right:10px" src="icsm/resources/img/draw_polygon.png">\r\n                     Drawing a polygon. On enabling, click on the map for each vertex, click on the first vertex to close the polygon. Don\'t do too many vertices, it will not afford you greater accuracy and will slow down your search.\r\n                  </li>\r\n                  <li>\r\n                     <i class="fa fa-keyboard-o fa-2x" style="padding-right:10px" aria-hidden="true"></i>\r\n                      Manually entering the minimum and maximum latitudes and longitudes. The same area restrictions apply to drawing the bounds.\r\n                  </li>\r\n               </ul>\r\n            </li>\r\n            <li>On drawing complete we will check for data within or very near your area of interest</li>\r\n            <li>If the list is large you can filter:\r\n               <ul>\r\n                  <li>Partial text match by typing in the filter field and/or</li>\r\n                  <li>You can restrict the display to either elevation (DEM) or point cloud file types</li>\r\n               </ul>\r\n            </li>\r\n            <li>Check against any file you would like to download. To reiterate, these files can be huge so take note of the file size before downloading</li>\r\n            <li>Review your selected datasets and submit.</li>\r\n            <li>An email will be sent to you with a link to all your data, zipped into a single file.</li>\r\n            <li>These files can be huge so take note of the file size before submitting or downloading</li>\r\n         </ul>\r\n      </p>\r\n      <h5>Hints</h5>\r\n      <p>\r\n         <ul>\r\n            <li>Hovering over many items will give you further information about the purpose of the item</li>\r\n            <li>Drawing a polyline allows you to measure distance along the polyline.</li>\r\n            <li>On completion on drawing a line the elevation along that line is plotted.</li>\r\n            <li>While the tool to draw your area of interest is enabled it is easiest to pan the map using the arrow keys.</li>\r\n            <li>There are many areas where there is no data though the coverage is improving all the time.</li\r\n         </ul>\r\n      </p>\r\n\t</div>\r\n   <div style="padding:30px; padding-top:0; padding-bottom:40px; width:100%">\r\n\t\t<div class="pull-right">\r\n\t\t  \t<button type="button" class="btn btn-primary" ng-model="seenSplash" ng-click="accept()" autofocus>Continue</button>\r\n\t\t</div>\r\n\t</div>\r\n</div>');
$templateCache.put('icsm/tempelevation/elevation.html','<div class="container-full elevationContainer" ng-show="geometry"\n    style="background-color:white; opacity:0.9;padding:2px">\n    <div class="row">\n        <div class="col-md-4" mars-point-info>\n            <span class="graph-brand">{{config.xLabel}}</span>\n        </div>\n        <div class="col-md-8">\n            <div class="btn-toolbar pull-right" role="toolbar" style="margin-right: 3px;">\n                <div class="btn-group">\n                    <button type="button" class="btn btn-default" title="Close graphs" ng-click="close()">\n                        <i class="fa fa-times-circle" role="presentation" style="font-size:16px; color:black"></i>\n                    </button>\n                </div>\n            </div>\n        </div>\n    </div>\n</div>\n');
$templateCache.put('icsm/themes/themes.html','<div class="dropdown themesdropdown">\r\n  <button class="btn btn-default dropdown-toggle themescurrent" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">\r\n    Theme\r\n    <span class="caret"></span>\r\n  </button>\r\n  <ul class="dropdown-menu" aria-labelledby="dropdownMenu1">\r\n    <li ng-repeat="item in themes">\r\n       <a href="#" title="{{item.title}}" ng-href="{{item.url}}" class="themesItemCompact">\r\n         <span class="icsm-icon" ng-class="item.className"></span>\r\n         <strong style="vertical-align:top;font-size:110%">{{item.label}}</strong>\r\n       </a>\r\n    </li>\r\n  </ul>\r\n</div>');
$templateCache.put('icsm/toolbar/toolbar.html','<div class="elevation-toolbar noPrint">\r\n   <div class="toolBarContainer">\r\n      <div>\r\n         <ul class="left-toolbar-items">\r\n            <li>\r\n               <div class="btn-group searchBar" ng-show="root.whichSearch != \'region\'">\r\n                  <div class="input-group input-group-custom" geo-search>\r\n                     <input type="text" ng-autocomplete ng-model="values.from.description" options=\'{country:"au"}\'\r\n                        size="32" title="Select a locality to pan the map to." class="form-control" aria-label="...">\r\n                     <div class="input-group-btn">\r\n                        <button ng-click="zoom(false)"\r\n                           class="btn btn-default" title="Pan and potentially zoom to location.">\r\n                           <i class="fa fa-search"></i>\r\n                        </button>\r\n                     </div>\r\n                  </div>\r\n               </div>\r\n            </li>\r\n         </ul>\r\n         <ul class="right-toolbar-items">\r\n            <li coverage-toggle></li>\r\n            <li>\r\n               <panel-trigger panel-id="download" panel-width="590px" name="Download" default="default"\r\n                  icon-class="fa-list" title="Select an area of interest and select datasets for download">\r\n               </panel-trigger>\r\n            </li>\r\n            <li>\r\n               <panel-trigger panel-id="help" panel-width="590px" name="Help" icon-class="fa-question-circle-o"\r\n                  title="Show help"></panel-trigger>\r\n            </li>\r\n            <li>\r\n               <panel-trigger panel-id="glossary" panel-width="590px" name="Glossary" icon-class="fa-book"\r\n                  title="Show glossary"></panel-trigger>\r\n            </li>\r\n            <li reset-page></li>\r\n         </ul>\r\n      </div>\r\n   </div>\r\n</div>');
$templateCache.put('icsm/view/view.html','<div class="container-fluid downloadPane">\r\n   <icsm-clip data="data.item"></icsm-clip>\r\n   <div class="list-container">\r\n      <icsm-list></icsm-list>\r\n   </div>\r\n   <div class="downloadCont" icsm-search-continue></div>\r\n</div>');}]);