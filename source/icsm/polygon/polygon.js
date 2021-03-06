{
   angular.module("icsm.polygon", ["icsm.message"])
   .directive('icsmPolygon', ['$rootScope', 'icsmMessageService', 'polygonService',
      function ($rootScope, icsmMessageService, polygonService) {
         return {
            restrict: 'AE',
            link: function () {
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
      }])

      .factory("polygonService", ['$http', '$q', '$rootScope', '$timeout', 'configService', 'flashService', 'messageService',
         function ($http, $q, $rootScope, $timeout, configService, flashService, messageService) {
            let notify;
            return {
               init: function () {
                  return $q((resolve, reject) => {
                     $rootScope.$on('icsm.polygon.drawn', function (event, clip) {
                        send('Area drawn. Checking for data...');
                        checkSize(clip).then(function (message) {
                           if (message.code === "success") {
                              getList(clip);
                           }
                        });
                     });
                  });
               },

               cancelDraw: function () {
                  drawService.cancelDraw();
               },

               checkSize: function (clip) {
                  return checkSize(clip);
               }
            };

            function send(message, type, duration) {
               flashService.remove(notify);

               if(message) {
                  if(type === "error") {
                     messageService.error(message);
                  } else {
                     notify = flashService.add( message, duration, true);
                  }
               }
            }

            function checkSize(clip) {
               let deferred = $q.defer();
               let result = drawn(clip);
               if (result && result.code) {
                  switch (result.code) {
                     case "oversize":
                        $timeout(function () {
                           send("", "clear");
                           send("The selected polygon's bounds exceeds the practical search size. Please confine your polygon within a bounds of approximately " +
                              "1.5 degrees square.",
                              "error");
                           deferred.resolve(result);
                        });
                        break;
                     case "undersize":
                        $timeout(function () {
                           send("", "clear");
                           send("X Min and Y Min should be smaller than X Max and Y Max, respectively. " +
                              "Please update the drawn area.", "error");
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
               let size = (clip.xMax - clip.xMin) * (clip.yMax - clip.yMin);
               return size < 0.00000000001 || clip.xMax < clip.xMin;
            }

            function overSizeLimit(clip) {
               // Shouldn't need abs but it doesn't hurt.
               let size = Math.abs((clip.xMax - clip.xMin) * (clip.yMax - clip.yMin));
               return size > 2.25;
            }


            function drawn(clip) {
               if (overSizeLimit(clip)) {
                  return { code: "oversize" };
               }

               if (underSizeLimit(clip)) {
                  return { code: "undersize" };
               }

               if (clip.xMax === null) {
                  return { code: "incomplete" };
               }

               if (validClip(clip)) {
                  return { code: "success" };
               }
               return { code: "invalid" };
            }

            // The input validator takes care of order and min/max constraints. We just check valid existance.
            function validClip(clip) {
               return clip &&
                  angular.isNumber(clip.xMax) &&
                  angular.isNumber(clip.xMin) &&
                  angular.isNumber(clip.yMax) &&
                  angular.isNumber(clip.yMin) &&
                  !overSizeLimit(clip) &&
                  !underSizeLimit(clip);
            }

            function getList(clip) {
               configService.getConfig("processing").then(function (conf) {
                  let url = conf.intersectsUrl;
                  if (url) {
                     // Order matches the $watch signature so be careful
                     let polygon = clip.polygon;

                     let params = [
                        "polygon=" + encodeURIComponent(polygon)
                     ];

                     if (clip.metadata) {
                        params.push("metadata=" + clip.metadata);
                     }

                     send("Checking there is data in your selected area...", "wait", 180000);
                     $http.get(url + params.join("&")).then(function (response) {
                        if (response.data && response.data.available_data) {
                           let hasData = false;
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
                     }, function (err) { // If it falls over we don't want to crash.
                        send("The service that provides the list of datasets is currently unavailable. " +
                           "Please try again later.", "error");
                     });
                  }
               });


               function decorateDownloadables(downloadables) {
                  Object.keys(downloadables).forEach(groupname => {
                     let group = downloadables[groupname];
                     Object.keys(group).forEach(listName => {
                        let items = group[listName];

                        items.forEach(item => decorateItem(item));
                     })
                  });
               }

               function decorateItem(item) {
                  item.fileSize = fileSize(item.file_size);
                  if(item.product) {
                     //  "bbox" : "113,-44,154,-10"
                     var arr = item.bbox.split(",").map(num => +num);
                     item.bbox = [
                        Math.max(arr[0], clip.xMin),
                        Math.max(arr[1], clip.yMin),
                        Math.min(arr[2], clip.xMax),
                        Math.min(arr[3], clip.yMax)
                     ].join(",");
                  }
               }

            }
         }]);


   function fileSize(size) {
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
   }

}