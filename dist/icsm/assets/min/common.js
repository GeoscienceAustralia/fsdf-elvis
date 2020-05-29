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

"use strict";angular.module("common.baselayer.control",["geo.maphelper","geo.map","common.slider"]).directive("commonBaselayerControl",["mapHelper","mapService",function(e,r){var t=12;return{template:'<slider ui-tooltip="hide" min="0" max="1" step="0.1" ng-model="slider.opacity" updateevent="slideStop"></slider>',scope:{maxZoom:"="},link:function(n){void 0===n.maxZoom&&(n.maxZoom=t),n.slider={opacity:-1,visibility:!0,lastOpacity:1},e.getPseudoBaseLayer().then(function(e){n.layer=e,n.slider.opacity=e.options.opacity}),n.$watch("slider.opacity",function(e,t){t<0||r.getMap().then(function(e){e.eachLayer(function(e){e.pseudoBaseLayer&&e.setOpacity(n.slider.opacity)})})})}}}]);var versions={3:{version:"3.0",link:"https://creativecommons.org/licenses/by/3.0/au/"},4:{version:"4.0",link:"https://creativecommons.org/licenses/by/4.0/"}};angular.module("common.cc",[]).directive("commonCc",[function(){return{templateUrl:"common/cc/cc.html",scope:{version:"=?"},link:function(e){e.version?e.details=versions[e.version]:e.details=versions[4],e.template="common/cc/cctemplate.html"}}}]);var captured=function(e){var t=e.split(" - ");return 2!==t.length?e:formatDate(t[0])+" - "+formatDate(t[1])},formatDate=function(e){return 8!==e.length?e:e.substr(0,4)+"/"+e.substr(4,2)+"/"+e.substr(6,2)};function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function _defineProperties(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function _createClass(e,t,n){return t&&_defineProperties(e.prototype,t),n&&_defineProperties(e,n),e}angular.module("common.featureinf",[]).directive("commonFeatureInf",["$http","$log","$q","$timeout","featureInfService","flashService","mapService","messageService",function(c,e,t,n,u,d,r,a){return{restrict:"AE",templateUrl:"common/featureinf/featureinf.html",link:function(l){var s=null;l.features=null,l.captured=captured,l.formatDate=formatDate,void 0===l.options&&(l.options={}),r.getMap().then(function(o){o.on("popupclose",function(e){u.removeLastLayer(o)}),l.close=function(){u.removeLastLayer(o),u.removePolygon(),l.features=null},l.entered=function(e){u.showPolygon(o,e)},l.left=function(e){u.removePolygon()},o.on("draw:drawstart point:start",function(){l.paused=!0}),o.on("draw:drawstop point:end",function(){n(function(){l.paused=!1},6)}),o.on("click",function(e){var a,t,n,r,i;l.paused||(console.log("clicked feature info"),a=null,t=o.getSize(),n=o.latLngToContainerPoint(e.latlng,o.getZoom()),e.latlng,r={x:n.x,y:n.y,bounds:o.getBounds().toBBoxString(),height:t.y,width:t.x},i="https://elvis2018-ga.fmecloud.com/fmedatastreaming/elvis_indexes/GetFeatureInfo_ElevationAvailableData.fmw?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&SRS=EPSG%3A4326&BBOX=${bounds}&WIDTH=${width}&HEIGHT=${height}&LAYERS=public.QLD_Elevation_Metadata_Index,public.ACT2015-Tile_Index_55,public.5dem_ProjectsIndex,public.NSW_100k_Index_54,public.NSW_100k_Index_55,public.NSW_100k_Index_56,public.NSW_100k_Index_Forward_Program,public.QLD_Project_Index_54,public.QLD_Project_Index_55,public.QLD_Project_Index_56,public.TAS_Project_Index_55,public.GA_Project_Index_47,public.GA_Project_Index_48,public.GA_Project_Index_54,public.GA_Project_Index_55,public.GA_Project_Index_56&STYLES=&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=100&X=${x}&Y=${y}",d.remove(s),s=d.add("Checking available data at this point",3e4,!0),angular.forEach(r,function(e,t){i=i.replace("${"+t+"}",e)}),c.get(i).then(function(e){var t,n,r=e.data;console.log(r),u.removeLastLayer(o),d.remove(s),r.length?(n=(t={data:{name:"public.AllIndexes",type:"FeatureCollection",crs:{type:"name",properties:{name:"EPSG:4326"}},features:[]}}).data.features,r.forEach(function(e){e.features.forEach(function(e){n.push(e);var t=e.properties.contact;t&&(e.properties.contact=0===t.toLowerCase().indexOf("mailto:")?"":"mailto:"+t)})}),(l.features=n).length&&(a=L.geoJson(t.data,{style:function(){return{fillOpacity:.1,color:"red"}}}).addTo(o),u.setLayer(a),n.length<3?l.d1Height="fi-d1x"+n.length:l.d1Height="fi-d1xb")):(s=d.add("No status information available for this point.",4e3),t=e,l.features=null)}))})})}}}]).factory("featureInfService",[function(){var t=null,n=null;return{setLayer:function(e){t=e},removeLastLayer:function(e){t&&(e.removeLayer(t),t=null)},showPolygon:function(e,t){n=L.geoJson({type:"FeatureCollection",features:[t]},{color:"green"}).addTo(e)},removePolygon:function(){n&&(n.remove(),n=null)}}}]),function(t){t.module("common.header",[]).controller("headerController",["$scope","$q","$timeout",function(n,e,t){n.$on("headerUpdated",function(e,t){n.headerConfig=t})}]).directive("icsmHeader",[function(){var e={current:"none",heading:"ICSM",headingtitle:"ICSM",helpurl:"help.html",helptitle:"Get help about ICSM",helpalttext:"Get help about ICSM",skiptocontenttitle:"Skip to content",skiptocontent:"Skip to content",quicklinksurl:"/search/api/quickLinks/json?lang=en-US"};return{transclude:!0,restrict:"EA",templateUrl:"common/header/header.html",scope:{current:"=",breadcrumbs:"=",heading:"=",headingtitle:"=",helpurl:"=",helptitle:"=",helpalttext:"=",skiptocontenttitle:"=",skiptocontent:"=",quicklinksurl:"="},link:function(n){t.copy(e);t.forEach(e,function(e,t){t in n||(n[t]=e)})}}}]).factory("headerService",["$http",function(){}])}(angular),angular.module("common.legend",[]).directive("commonLegend",[function(){return{template:"<img ng-href='url' ng-if='url'></img>",scope:{map:"="},restrict:"AE",link:function(e){e.map}}}]),angular.module("common.altthemes",[]).directive("altThemes",["altthemesService",function(n){return{restrict:"AE",templateUrl:"common/navigation/altthemes.html",scope:{current:"="},link:function(t){n.getThemes().then(function(e){t.themes=e}),n.getCurrentTheme().then(function(e){t.theme=e}),t.changeTheme=function(e){t.theme=e,n.setTheme(e.key)}}}}]).controller("altthemesCtrl",["altthemesService",function(e){this.service=e}]).filter("altthemesFilter",function(){return function(e,t){var n=[];return t?(e&&e.forEach(function(e){e.themes&&e.themes.some(function(e){return e===t.key})&&n.push(e)}),n):e}}).factory("altthemesService",["$q","$http","storageService",function(t,e,n){var r="icsm.current.theme",a="icsm/resources/config/themes.json?v=1",i=[],o=this;return this.themes=[],this.theme=null,n.getItem(r).then(function(n){n=n||"All",e.get(a,{cache:!0}).then(function(e){var t=e.data.themes;o.themes=t,o.theme=t[n],angular.forEach(t,function(e,t){e.key=t}),i.forEach(function(e){e.resolve(o.theme)})})}),this.getCurrentTheme=function(){if(this.theme)return t.when(o.theme);var e=t.defer();return i.push(e),e.promise},this.getThemes=function(){return e.get(a,{cache:!0}).then(function(e){return e.data.themes})},this.setTheme=function(e){this.theme=this.themes[e],n.setItem(r,e)},this}]).filter("altthemesEnabled",function(){return function(e){return e?e.filter(function(e){return!!e.enabled}):e}}).filter("altthemesMatchCurrent",function(){return function(e,t){return e?e.filter(function(e){return!!e.keys.find(function(e){return e===t})}):e}}),angular.module("common.navigation",[]).directive("commonNavigation",[function(){return{restrict:"AE",template:"<alt-themes current='current'></alt-themes>",scope:{current:"=?"},link:function(e){e.username="Anonymous",e.current||(e.current="none")}}}]).factory("navigationService",[function(){return{}}]),angular.module("common.reset",[]).directive("resetPage",function(t){return{restrict:"AE",scope:{},templateUrl:"common/reset/reset.html",controller:["$scope",function(e){e.reset=function(){t.location.reload()}}]}}),angular.module("common.side-panel",[]).factory("panelSideFactory",["$rootScope","$timeout",function(n,e){var r={left:{active:null,width:0},right:{active:null,width:0}};function a(e,t){var n=e.active;return n===t?(e.active=null,e.width=0):e.active=t,!n}return{state:r,setLeft:function(e){var t=a(r.left,e);return t&&(r.left.width=320),t},setRight:function(e){r.right.width=e.width;var t=a(r.right,e.name);return n.$broadcast("side.panel.change",{side:"right",data:r.right,width:e.width}),t}}}]).directive("sidePanelRightOppose",["panelSideFactory",function(t){return{restrict:"E",transclude:!0,template:'<div class="contentContainer" ng-attr-style="right:{{right.width}}"><ng-transclude></ng-transclude></div>',link:function(e){e.right=t.state.right}}}]).directive("sidePanelRight",["panelSideFactory",function(t){return{restrict:"E",transclude:!0,templateUrl:"icsm/side-panel/side-panel-right.html",link:function(e){e.right=t.state.right,e.closePanel=function(){t.setRight({name:null,width:0})}}}}]).directive("panelTrigger",["panelSideFactory",function(t){return{restrict:"E",transclude:!0,templateUrl:"common/side-panel/trigger.html",scope:{default:"@?",panelWidth:"@",name:"@",iconClass:"@",panelId:"@"},link:function(e){e.toggle=function(){t.setRight({width:e.panelWidth,name:e.panelId})},e.default&&t.setRight({width:e.panelWidth,name:e.panelId})}}}]).directive("panelOpenOnEvent",["$rootScope","panelSideFactory",function(e,i){return{restrict:"E",scope:{panelWidth:"@",eventName:"@",panelId:"@",side:"@?"},link:function(a){a.side||(a.side="right"),e.$on(a.eventName,function(e,t){var n,r=i.state[a.side];!r||r.active&&a.panelId===r.active||(n={width:a.panelWidth,name:a.panelId},"right"===a.side?i.setRight(n):i.setLeft(n))})}}}]).directive("panelCloseOnEvent",["$rootScope","panelSideFactory",function(e,i){return{restrict:"E",scope:{eventName:"@",side:"@?",onlyOn:"@?"},link:function(a){a.side||(a.side="right"),e.$on(a.eventName,function(e,t){var n,r=i.state[a.side];a.onlyOn&&r.active!==a.onlyOn||r&&r.active&&(n={name:null},"right"===a.side?i.setRight(n):i.setLeft(n))})}}}]).directive("sidePanelLeft",["panelSideFactory",function(t){return{restrict:"E",transclude:!0,templateUrl:"icsm/side-panel/side-panel-left.html",link:function(e){e.left=t.state.left,e.closeLeft=function(){t.setLeft(null)}}}}]),angular.module("common.scroll",[]).directive("commonScroller",["$timeout",function(a){return{scope:{more:"&",buffer:"=?"},link:function(n,e){var r;n.buffer||(n.buffer=100),e.on("scroll",function(e){var t=e.currentTarget;a.cancel(r),r=a(function(){n.more&&t.scrollHeight-t.scrollTop<=t.clientHeight+n.buffer&&n.more()},120)})}}}]),angular.module("common.slider",[]).directive("slider",["$parse","$timeout",function(h,v){return{restrict:"AE",replace:!0,template:'<div><input class="slider-input" type="text" /></div>',require:"ngModel",scope:{max:"=",min:"=",step:"=",value:"=",ngModel:"=",range:"=",enabled:"=",sliderid:"=",formatter:"&",onStartSlide:"&",onStopSlide:"&",onSlide:"&"},link:function(u,d,p,m){var f,g;function t(){var r={};function e(e,t,n){r[e]=t||n}function t(e,t,n){r[e]=t?parseFloat(t):n}function n(e,t,n){r[e]=t?t+""=="true":n}function a(e){return angular.isString(e)&&0===e.indexOf("[")?angular.fromJson(e):e}e("id",u.sliderid),e("orientation",p.orientation,"horizontal"),e("selection",p.selection,"before"),e("handle",p.handle,"round"),e("tooltip",p.uiTooltip,"show"),e("tooltipseparator",p.tooltipseparator,":"),t("min",u.min,0),t("max",u.max,10),t("step",u.step,1);var i,o=r.step+"",l=o.substring(o.lastIndexOf(".")+1);t("precision",p.precision,l),n("tooltip_split",p.tooltipsplit,!1),n("enabled",p.enabled,!0),n("naturalarrowkeys",p.naturalarrowkeys,!1),n("reversed",p.reversed,!1),n("range",u.range,!1),r.range?(angular.isArray(u.value)?r.value=u.value:angular.isString(u.value)?(r.value=a(u.value),angular.isArray(r.value)||(i=parseFloat(u.value),isNaN(i)&&(i=5),i<u.min?(i=u.min,r.value=[i,r.max]):i>u.max?(i=u.max,r.value=[r.min,i]):r.value=[r.min,r.max])):r.value=[r.min,r.max],u.ngModel=r.value):t("value",u.value,5),u.formatter&&(r.formatter=u.$eval(u.formatter));var s,c=$(d).find(".slider-input").eq(0);$.fn.slider&&($.fn.slider.constructor.prototype.disable=function(){this.picker.off()},$.fn.slider.constructor.prototype.enable=function(){this.picker.on()},c.slider(r),c.slider("destroy"),c.slider(r),s=a(p.updateevent),s=angular.isString(s)?[s]:["slide"],angular.forEach(s,function(e){c.on(e,function(e){m.$setViewValue(e.value),v(function(){u.$apply()})})}),c.on("change",function(e){m.$setViewValue(e.value.newValue),v(function(){u.$apply()})}),angular.forEach({slideStart:"onStartSlide",slide:"onSlide",slideStop:"onStopSlide"},function(t,e){c.on(e,function(e){u[t]&&(h(p[t])(u.$parent,{$event:e,value:e.value}),v(function(){u.$apply()}))})}),angular.isFunction(g)&&(g(),g=null),angular.isDefined(p.ngDisabled)&&(g=u.$watch(p.ngDisabled,function(e){e?c.slider("disable"):c.slider("enable")})),angular.isFunction(f)&&f(),f=u.$watch("ngModel",function(e){c.slider("setValue",e)})),window.slip=c,u.$watch("enabled",function(e){e?c.slider("disable"):c.slider("enable")})}t();angular.forEach(["min","max","step","range"],function(e){u.$watch(e,function(){t()})})}}}]),angular.module("common.storage",["explorer.projects"]).factory("storageService",["$log","$q","projectsService",function(r,a,e){return{setGlobalItem:function(e,t){this._setItem("_system",e,t)},setItem:function(t,n){e.getCurrentProject().then(function(e){this._setItem(e,t,n)}.bind(this))},_setItem:function(e,t,n){r.debug("Fetching state for key locally"+t),localStorage.setItem("mars.anon."+e+"."+t,JSON.stringify(n))},getGlobalItem:function(e){return this._getItem("_system",e)},getItem:function(t){var n=a.defer();return e.getCurrentProject().then(function(e){this._getItem(e,t).then(function(e){n.resolve(e)})}.bind(this)),n.promise},_getItem:function(e,t){r.debug("Fetching state locally for key "+t);var n=localStorage.getItem("mars.anon."+e+"."+t);if(n)try{n=JSON.parse(n)}catch(e){}return a.when(n)}}}]);var TerrainLoader=function(){function e(){_classCallCheck(this,e)}return _createClass(e,[{key:"load",value:function(e,n,r){var t=new XMLHttpRequest;t.addEventListener("load",function(e){try{var t=new GeotiffParser;t.parseHeader(e.target.response),n(t.loadPixels())}catch(e){r(e)}},!1),void 0!==r&&t.addEventListener("error",function(e){r(e)},!1),t.open("GET",e,!0),t.responseType="arraybuffer",t.send(null)}}]),e}();angular.module("common.templates",[]).run(["$templateCache",function(e){e.put("common/cc/cc.html",'<button type="button" class="undecorated" title="View CCBy {{details.version}} licence details"\r\n      popover-trigger="outsideClick"\r\n      uib-popover-template="template" popover-placement="bottom" popover-append-to-body="true">\r\n\t<i ng-class="{active:data.isWmsShowing}" class="fa fa-lg fa-gavel"></i>\r\n</button>'),e.put("common/cc/cctemplate.html",'<div>\r\n   <div class="row">\r\n      <div class="col-md-12">\r\n         <a target="_blank" ng-href="{{details.link}}">Creative Commons Attribution {{details.version}} </a>\r\n      </div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-2">\r\n         <span class="fa-stack" aria-hidden="true">\r\n         <i class="fa fa-check-circle-o fa-stack-2x" aria-hidden="true"></i>\r\n      </span>\r\n      </div>\r\n      <div class="col-md-10">\r\n         You may use this work for commercial purposes.\r\n      </div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-2">\r\n         <span class="fa-stack" aria-hidden="true">\r\n         <i class="fa fa-circle-o fa-stack-2x"></i>\r\n         <i class="fa fa-female fa-stack-1x"></i>\r\n      </span>\r\n      </div>\r\n      <div class="col-md-10">\r\n         You must attribute the creator in your own works.\r\n      </div>\r\n   </div>\r\n</div>'),e.put("common/featureinf/featureinf.html",'<div class="fi-d1" drag-parent parentclass="featureInfContainer" ng-class="d1Height">\n    <button class="undecorated fi-close" ng-click="close()">X</button>\n    <div class="fi-d2">\n      <div class="fi-d3">\n        <div class="fi-d3-1">\n            <strong style="font-size: 120%;padding:2px;">Features</strong>\n        </div>\n        <div class="fi-d3-2">\n          <div class="fi-d4">\n            <div class="fi-d5">\n                <div style="padding:5px;" ng-repeat="feature in features" ng-mouseenter="entered(feature)" ng-mouseleave="left()">\n                    <div ng-if="feature.properties.maptitle" style="white-space: nowrap;">\n                        <strong>Map Title:</strong>\n                        <span title=\'{{feature.properties.mapnumber ? "Map number: " + feature.properties.mapnumber : ""}}\'>\n                            {{feature.properties.maptitle}}\n                        </span>\n                    </div>\n    \n                    <div ng-if="feature.properties.project">\n                        <strong>Project Name:</strong>\n                        {{feature.properties.project}}\n                    </div>\n    \n                    <div ng-if="feature.properties.captured">\n                        <strong>Capture Date:</strong>{{captured(feature.properties.captured)}}\n                    </div>\n    \n                    <div\n                        ng-if="feature.properties.object_name || feature.properties.object_name_ahd || feature.properties.object_name_ort">\n                        <strong>File Name:</strong>\n                        {{feature.properties.object_name}}{{feature.properties.object_name_ahd}}{{feature.properties.object_name_ort}}\n                    </div>\n    \n                    <div>\n                        <strong>Status:</strong>\n                        {{feature.properties.status}}\n                    </div>\n    \n                    <div ng-if="feature.properties.available_date">\n                        <strong>Available Date:</strong>\n                        {{formatDate(feature.properties.available_date)}}\n                    </div>\n    \n                    <div ng-if="feature.properties.contact">\n                        <strong>Contact:</strong> <a\n                            href=\'{{feature.properties.contact}}\'>{{feature.properties.contact}}</a>\n                    </div>\n    \n                    <div ng-if="feature.properties.metadata_url">\n                        <a href=\'{{feature.properties.metadata_url}}\' target=\'_blank\'>Metadata</a>\n                    </div>\n                    <hr ng-if="!$last" style="margin:5px"/>\n                </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>'),e.put("common/header/header.html",'<div class="container-full common-header" style="padding-right:10px; padding-left:10px">\r\n   <div class="navbar-header">\r\n\r\n      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".ga-header-collapse">\r\n         <span class="sr-only">Toggle navigation</span>\r\n         <span class="icon-bar"></span>\r\n         <span class="icon-bar"></span>\r\n         <span class="icon-bar"></span>\r\n      </button>\r\n\r\n      <a href="/" class="appTitle visible-xs">\r\n         <h1 style="font-size:120%">{{heading}}</h1>\r\n      </a>\r\n   </div>\r\n   <div class="navbar-collapse collapse ga-header-collapse">\r\n      <ul class="nav navbar-nav">\r\n         <li class="hidden-xs">\r\n            <a href="https://www.icsm.gov.au/" target="_blank" class="icsm-logo"\r\n               style="margin-top: -4px;display:inline-block;">\r\n               <img alt="ICSM - ANZLIC Committee on Surveying &amp; Mapping" class="header-logo"\r\n                  src="icsm/resources/img/icsm-logo-sml.gif">\r\n            </a>\r\n            <a href="/" style="margin-top:8px; padding:5px;display:inline-block">\r\n               <h1 class="applicationTitle">{{heading}}</h1>\r\n            </a>\r\n         </li>\r\n      </ul>\r\n      <ul class="nav navbar-nav navbar-right nav-icons">\r\n         <li common-navigation role="menuitem" current="current" style="padding-right:10px"></li>\r\n         <li mars-version-display role="menuitem"></li>\r\n         <li style="width:10px"></li>\r\n      </ul>\r\n   </div>\r\n   \x3c!--/.nav-collapse --\x3e\r\n</div>\r\n<div class="contributorsLink" style="position: absolute; right:7px; bottom:15px">\r\n   <icsm-contributors-link></icsm-contributors-link>\r\n</div>\r\n\x3c!-- Strap --\x3e\r\n<div class="row">\r\n   <div class="col-md-12">\r\n      <div class="strap-blue">\r\n      </div>\r\n      <div class="strap-white">\r\n      </div>\r\n      <div class="strap-red">\r\n      </div>\r\n   </div>\r\n</div>'),e.put("common/navigation/altthemes.html",'<span class="altthemes-container">\r\n\t<span ng-repeat="item in themes | altthemesEnabled">\r\n       <a title="{{item.label}}" ng-href="{{item.url}}" class="altthemesItemCompact" target="_blank">\r\n         <span class="altthemes-icon" ng-class="item.className"></span>\r\n       </a>\r\n    </li>\r\n</span>'),e.put("common/reset/reset.html",'<button type="button" class="map-tool-toggle-btn" ng-click="reset()" title="Reset page">\r\n   <span class="panel-sm">Reset</span>\r\n   <i class="fa fa-lg fa-refresh"></i>\r\n</button>'),e.put("common/side-panel/trigger.html",'<button ng-click="toggle()" type="button" class="map-tool-toggle-btn">\r\n   <span class="panel-sm">{{name}}</span>\r\n   <ng-transclude></ng-transclude>\r\n   <i class="fa fa-lg" ng-class="iconClass"></i>\r\n</button>')}]);