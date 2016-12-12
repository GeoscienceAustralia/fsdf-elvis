"use strict";function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function _toConsumableArray(e){if(Array.isArray(e)){for(var t=0,n=Array(e.length);t<e.length;t++)n[t]=e[t];return n}return Array.from(e)}!function(e){e.module("placenames.header",[]).controller("headerController",["$scope","$q","$timeout",function(e,t,n){var a=function(e){return e};e.$on("headerUpdated",function(t,n){e.headerConfig=a(n)})}]).directive("placenamesHeader",[function(){var t={heading:"Place Names",headingtitle:"Place Names",helpurl:"help.html",helptitle:"Get help about Place Names",helpalttext:"Get help about Place Names",skiptocontenttitle:"Skip to content",skiptocontent:"Skip to content",quicklinksurl:"/search/api/quickLinks/json?lang=en-US"};return{transclude:!0,restrict:"EA",templateUrl:"placenames/header/header.html",scope:{breadcrumbs:"=",heading:"=",headingtitle:"=",helpurl:"=",helptitle:"=",helpalttext:"=",skiptocontenttitle:"=",skiptocontent:"=",quicklinksurl:"="},link:function(n,a,r){e.copy(t);e.forEach(t,function(e,t){t in n||(n[t]=e)})}}}]).factory("headerService",["$http",function(){}])}(angular),function(e){function t(e,t){var n=this;t.getConfig().then(function(e){n.data=e;try{var t=document.createElement("canvas");e.modern=!(!window.WebGLRenderingContext||!t.getContext("webgl")&&!t.getContext("experimental-webgl"))}catch(a){e.modern=!1}})}e.module("PlacenamesApp",["placenames.header","placenames.panes","placenames.results","placenames.templates","placenames.search","placenames.toolbar","placenames.utils","geo.map","common.altthemes","common.baselayer.control","common.navigation","common.proxy","common.storage","common.templates","explorer.config","explorer.confirm","explorer.drag","explorer.enter","explorer.flasher","explorer.googleanalytics","explorer.httpdata","explorer.info","explorer.legend","explorer.message","explorer.modal","explorer.projects","explorer.tabs","explorer.version","exp.ui.templates","ui.bootstrap","ui.bootstrap-slider","ngAutocomplete","ngRoute","ngSanitize","page.footer"]).config(["configServiceProvider","projectsServiceProvider","versionServiceProvider",function(e,t,n){e.location("icsm/resources/config/placenames.json"),e.dynamicLocation("icsm/resources/config/appConfig.json?t="),n.url("icsm/assets/package.json"),t.setProject("icsm")}]).run(["mapService",function(e){e.getMap().then(function(e){e.options.maxZoom=16})}]).factory("userService",[function(){function e(){return!0}return{login:e,hasAcceptedTerms:e,setAcceptedTerms:e,getUsername:function(){return"anon"}}}]).controller("RootCtrl",t),t.$invoke=["$http","configService"]}(angular),function(e){function t(){return{add:function(e){},remove:function(e){}}}var n=function a(e){_classCallCheck(this,a),e.data().then(function(e){this.data=e}.bind(this))};n.$inject=["paneService"],t.$inject=[],e.module("placenames.panes",[]).directive("placenamesPanes",["$rootScope","$timeout","mapService",function(e,t,n){return{templateUrl:"placenames/panes/panes.html",transclude:!0,scope:{defaultItem:"@",data:"="},controller:["$scope",function(a){var r=!1;a.view=a.defaultItem,a.setView=function(t){var i=a.view;a.view===t?(t&&(r=!0),a.view=""):(t||(r=!0),a.view=t),e.$broadcast("view.changed",a.view,i),r&&n.getMap().then(function(e){e._onResize()})},t(function(){e.$broadcast("view.changed",a.view,null)},50)}]}}]).directive("placenamesTabs",[function(){return{templateUrl:"placenames/panes/tabs.html",require:"^placenamesPanes"}}]).controller("PaneCtrl",n).factory("paneService",t)}(angular),function(e){e.module("placenames.results.item",[]).directive("placenamesResultsItem",["placenamesResultsService",function(e){return{templateUrl:"placenames/results/item.html",bindToController:{item:"="},controller:function(){var t=this;this.showPan=function(t){e.showPan(t)},e.load(this.item.id).then(function(e){t.feature=e.features[0]})},controllerAs:"vm"}}]).factory("placenamesItemService",["mapService",function(e){var t={};return t}])}(angular),function(e){function t(e,t,n,a,r,i){var s,o=7,c={showPan:function(e){return this.show(e).then(function(e){var t=e.map;return t.panTo(e.location,{animate:!0}),t.getZoom()<o&&t.setZoom(o,{animate:!0}),e})},show:function(e){return this.hide().then(function(t){var n=e.location.split(" ").reverse().map(function(e){return+e});return s=L.popup().setLatLng(n).setContent(e.name+"<br/>Lat/Lng: "+n[0]+"&deg;"+ +n[1]+"&deg;").openOn(t),{location:n,map:t,marker:s}})},hide:function(e){return r.getMap().then(function(e){return s&&e.removeLayer(s),e})},get config(){return a.getConfig().then(function(e){return e.results})},load:function(t){return this.config.then(function(n){var a=n.esriTemplate;return e.get(a.replace("${id}",t)).then(function(e){return e})})},moreDocs:function(e){var t=e.data.response,n=t.docs.length;if(!(n>=t.numFound)){var a=e.params;a.start=n,i.request(a).then(function(e){var n;(n=t.docs).push.apply(n,_toConsumableArray(e.response.docs))})}}};return c}e.module("placenames.results",["placenames.results.item"]).directive("placenamesResults",["placenamesResultsService",function(e){return{templateUrl:"placenames/results/results.html",bindToController:{data:"="},controller:function(){this.clear=function(e){this.data.persist.item=null,this.data.searched=!1}},controllerAs:"ctrl",link:function(t){t.$destroy=function(){e.hide()},e.moreDocs(t.ctrl.data.persist)}}}]).factory("placenamesResultsService",t),t.$inject=["proxy","$rootScope","$timeout","configService","mapService","placenamesSearchService"]}(angular);var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol?"symbol":typeof e};!function(e){function t(e,t,n,a,r){function i(){return s().then(function(e){return o(e).then(function(t){return h.persist(e,t),t})})}function s(){return r.getMap().then(function(e){var t=f.classifications,n=Object.keys(t).filter(function(e){return t[e].selected}),a=p(),r="object"===_typeof(f.filter),i=r?f.filter.name:f.filter;return a.fq=u(e),a.sort=d(e),a.q=i?'"'+i.toLowerCase()+'"':"*:*",n.length&&(1===n.length?a.q+=" AND featureCode:"+n[0]:a.q+=" AND (featureCode:("+n.map(function(e){return"featureCode:"+e}).join(" ")+"))"),a})}function o(e){return c(e).then(function(e){var t;return e.facetCounts={},e.facet_counts.facet_fields.featureCode.forEach(function(n,a){a%2===0?t=n:e.facetCounts[t]={count:n,code:t}}),l(e.facetCounts),e})}function c(t){return e({url:"/select",method:"GET",params:t,cache:!0}).then(function(e){return e.data})}function l(e){Object.keys(e).forEach(function(t){e[t].parent=f.classifications[t]})}function d(e){var t=e.getBounds(),n=(t.getEast()-t.getWest())/2,a=(t.getNorth()-t.getSouth())/2;return"geodist(ll,"+(t.getSouth()+a)+","+(t.getWest()+n)+") asc"}function u(e){var t=e.getBounds();return"location:["+Math.max(t.getSouth(),-90)+","+Math.max(t.getWest(),-180)+" TO "+Math.min(t.getNorth(),90)+","+Math.min(t.getEast(),180)+"]"}function p(){return{facet:!0,"facet.field":"featureCode",rows:15,wt:"json"}}var m,f={searched:!1,featureCodes:[]},v=[],h={onMapUpdate:function(e){v.push(e)},offMapUpdate:function(e){delete v[e]},get data(){return f},filtered:function(){return i().then(function(e){return f.filtered=e,e})},request:function(e){return c(e)},search:function(e){e&&(f.persist.item=e),this.searched()},persist:function(e,t){f.persist={params:e,data:t}},searched:function(){f.searched=!0,this.hide()},show:function(e){this.hide().then(function(t){m=L.marker(e.location.split(" ").reverse().map(function(e){return+e})).addTo(t)})},hide:function(e){return r.getMap().then(function(e){return m&&e.removeLayer(m),e})}};return a.getConfig("classifications").then(function(e){f.classifications={},Object.keys(e).forEach(function(t){f.classifications[t]={name:e[t]}})}),r.getMap().then(function(e){var t;e.on("resize moveend viewreset",function(){n.cancel(t),f.searched||(t=n(function(){h.filtered()},200),v.forEach(function(e){e()}))})}),h}e.module("placenames.search",[]).directive("placenamesClear",["placenamesSearchService",function(e){return{link:function(t,n){function a(){if(console.log("listened.."),n.is(":focus")){console.log("Focused");var e=$.Event("keydown");e.which=27,n.trigger(e),n.blur()}}e.onMapUpdate(a),console.log("ERR")}}}]).directive("placenamesOptions",["placenamesSearchService",function(e){return{link:function(t){t.leave=function(){e.hide()},t.enter=function(){e.show(t.match.model)},t.$destroy=function(){e.hide()}}}}]).directive("placenamesSearch",["$timeout","placenamesSearchService",function(e,t){return{templateUrl:"placenames/search/search.html",restrict:"AE",link:function(e){e.state=t.data,e.$watch("state.searched",function(t,n){!t&&n&&(e.state.filter="")}),t.filtered(),e.update=function(){t.filtered()},e.loadOnEmpty=function(){e.state.filter||t.filtered()},e.search=function(e){t.search(e)},e.select=function(t){e.search(t)},e.deselect=function(e){e.selected=!1,t.filtered()},e.loadDocs=function(){return t.filtered().then(function(e){return e.response.docs})}}}}]).filter("pnDocName",[function(){return function(e){return e?e.map(function(e){return e.name+" ("+e.recordId+")"}):[]}}]).filter("pnSomeSelected",[function(){return function(e){return!!e&&Object.keys(e).some(function(t){return e[t].selected})}}]).filter("pnUnselectedFacets",[function(){return function(e){return e?Object.keys(e).filter(function(t){return!e[t].selected}).map(function(t){return e[t]}):[]}}]).filter("pnSelectedFacets",[function(){return function(e){return e?Object.keys(e).filter(function(t){return e[t].selected}).map(function(t){var n=e[t];return n.code=t,n}):[]}}]).filter("pnClean",[function(){return function(e){return e.replace(/\s?[, ]\s?/g," ")}}]).filter("pnTooltip",[function(){return function(e){var t="<div style='text-align:left'>";return e.variant&&!function(){var n=e.variant.split("|");n.forEach(function(e,a){t+=a?"":"Also known as",t+=(a&&a<n.length-1?",":"")+" ",a&&a===n.length-1&&(t+="or "),t+=e}),t+="<br/>"}(),t+="Lat "+e.location.split(" ").reverse().join("&deg; Lng ")+"&deg;<br/>Classification: "+e.classification+"</div>"}}]).factory("placenamesSearchService",t),t.$inject=["$http","$rootScope","$timeout","configService","mapService"]}(angular),function(e){e.module("placenames.toolbar",[]).directive("placenamesToolbar",[function(){return{controller:"toolbarLinksCtrl"}}]).directive("placenamesToolbarRow",[function(){var e="Satellite to Topography bias on base map.";return{scope:{map:"=",overlaytitle:"=?"},restrict:"AE",templateUrl:"placenames/toolbar/toolbar.html",link:function(t){t.overlaytitle=t.overlaytitle?t.overlaytitle:e}}}]).controller("toolbarLinksCtrl",["$scope","configService",function(e,t){var n=this;t.getConfig().then(function(e){n.links=e.toolbarLinks}),e.item="",e.toggleItem=function(t){e.item=e.item==t?"":t}}])}(angular),function(e){e.module("placenames.utils",[]).filter("pnSplitBar",function(){return function(e){var t="";return(e?e:"").split("|").forEach(function(e,n,a){t+=(n&&n<a.length-1?",":"")+" ",n&&n===a.length-1&&(t+="or "),t+=e}),t}}).filter("pnFeature",["configService",function(e){var t;return e.getConfig("classifications").then(function(e){t=e}),function(e){return t?t[e]:e}}]).factory("placenamesUtilsService",["configService",function(e){var t={};return t}])}(angular),angular.module("placenames.templates",[]).run(["$templateCache",function(e){e.put("placenames/header/header.html",'<div class="container-full common-header" style="padding-right:10px; padding-left:10px">\r\n    <div class="navbar-header">\r\n\r\n        <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".ga-header-collapse">\r\n            <span class="sr-only">Toggle navigation</span>\r\n            <span class="icon-bar"></span>\r\n            <span class="icon-bar"></span>\r\n            <span class="icon-bar"></span>\r\n        </button>\r\n\r\n        <a href="http://www.ga.gov.au" class="hidden-xs header-logo" style="padding-right: 0">\r\n            <img src="icsm/resources/img/icsm-logo-sml.gif" alt="ICSM - ANZLIC Committee on Surveying &amp; Mapping" class="elvis-logo"></img>\r\n        </a>\r\n        <a href="/" class="appTitle visible-xs"><h1 style="font-size:120%">{{heading}}</h1></a>\r\n    </div>\r\n    <div class="navbar-collapse collapse ga-header-collapse">\r\n        <ul class="nav navbar-nav">\r\n            <li class="hidden-xs"><a href="/"><h1 class="applicationTitle">{{heading}}</h1></a></li>\r\n        </ul>\r\n        <ul class="nav navbar-nav navbar-right nav-icons">\r\n        \t<li common-navigation ng-show="username" role="menuitem" style="padding-right:10px"></li>\r\n\t\t\t<li mars-version-display role="menuitem"></li>\r\n\t\t\t<li style="width:10px"></li>\r\n        </ul>\r\n    </div><!--/.nav-collapse -->\r\n</div>\r\n\r\n<!-- Strap -->\r\n<div class="row">\r\n    <div class="col-md-12">\r\n        <div class="strap-blue">\r\n        </div>\r\n        <div class="strap-white">\r\n        </div>\r\n        <div class="strap-red">\r\n        </div>\r\n    </div>\r\n</div>'),e.put("placenames/panes/panes.html",'<div class="container contentContainer">\r\n\t<div class="row icsmPanesRow" >\r\n\t\t<div class="icsmPanesCol" ng-class="{\'col-md-12\':!view, \'col-md-7\':view}" style="padding-right:0">\r\n\t\t\t<div class="expToolbar row noPrint" placenames-toolbar-row map="root.map" ></div>\r\n\t\t\t<div class="panesMapContainer target" geo-map configuration="data.map">\r\n\t\t\t    <geo-extent></geo-extent>\r\n\t\t\t</div>\r\n    \t\t<div geo-draw data="data.map.drawOptions" line-event="elevation.plot.data" rectangle-event="bounds.drawn"></div>\r\n    \t\t<div placenames-tabs class="icsmTabs"  ng-class="{\'icsmTabsClosed\':!view, \'icsmTabsOpen\':view}"></div>\r\n\t\t</div>\r\n\t\t<div class="icsmPanesColRight" ng-class="{\'hidden\':!view, \'col-md-5\':view}" style="padding-left:0; padding-right:0">\r\n\t\t\t<div class="pnTabContentItem" ng-show="view == \'search\'" ><placenames-search></placenames-search></div>\r\n\t\t</div>\r\n\t</div>\r\n</div>'),e.put("placenames/panes/tabs.html",'<!-- tabs go here -->\r\n<div id="panesTabsContainer" class="paneRotateTabs" style="opacity:0.9" ng-style="{\'right\' : contentLeft +\'px\'}">\r\n\t<div class="paneTabItem" ng-class="{\'bold\': view == \'search\'}" ng-click="setView(\'search\')">\r\n\t\t<button class="undecorated">Search</button>\r\n\t</div>\r\n</div>\r\n'),e.put("placenames/results/item.html",'<div class="container-fluid">\r\n   <div class="row">\r\n      <div class="col-md-12 pn-header" >\r\n         <button type="button" class="undecorated" ng-click="vm.showPan(vm.item)"\r\n                tooltip-append-to-body="true" title="Zoom to location and mark." tooltip-placement="left" uib-tooltip="Zoom to location and mark">\r\n            <i class="fa fa-lg fa-flag-o"></i>\r\n         </button>\r\n         <span>{{vm.feature.attributes.Name}}</span>\r\n         <span class="pull-right">Record ID: {{vm.feature.attributes.Record_ID}}</span>\r\n      </div>\r\n   </div>\r\n   <div class="row" ng-if="vm.feature.attributes.Variant_Name">\r\n      <div class="col-md-4">Variant Name</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.Variant_Name | pnSplitBar}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">State</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.State}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Feature Type</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.Feature_code | pnFeature}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Classification</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.Classification}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">CGDN</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.CGDN}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Concise Gazetteer</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.Concise_gaz}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">1:100K Map Index</div>\r\n      <div class="col-md-8"><span class="pn-numeric">{{vm.feature.attributes.Map_100K}}</span></div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Authority</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.Authority_ID}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Status Description</div>\r\n      <div class="col-md-8">{{vm.feature.attributes.Status_desc}}</div>\r\n   </div>\r\n   <div class="row">\r\n      <div class="col-md-4">Latitude</div>\r\n      <div class="col-md-8"><span class="pn-numeric">\r\n         {{vm.feature.attributes.Lat_degrees}}&deg;\r\n         {{vm.feature.attributes.Lat_minutes}}&prime;\r\n         {{vm.feature.attributes.Lat_seconds}}&Prime;\r\n         ({{vm.feature.attributes.Latitude}}&deg;)</span></div>\r\n   </div>\r\n\r\n   <div class="row">\r\n      <div class="col-md-4">Longitude</div>\r\n      <div class="col-md-8"><span class="pn-numeric">\r\n         {{vm.feature.attributes.Long_degrees}}&deg;\r\n         {{vm.feature.attributes.Long_minutes}}&prime;\r\n         {{vm.feature.attributes.Long_seconds}}&Prime;\r\n         ({{vm.feature.attributes.Longitude}}&deg;)</span></div>\r\n   </div>\r\n</div>'),e.put("placenames/results/results.html",'<div class="pn-container">\r\n   <nav class="navbar navbar-default" style="min-height:25px">\r\n      <div class="container-fluid">\r\n         <div class="navbar-header">\r\n            <div class="navbar-brand">\r\n               <a href="#" ng-click="ctrl.clear()"><i class="fa fa-angle-double-left" aria-hidden="true"></i></a> Matched {{ctrl.data.persist.data.response.numFound | number}}\r\n               features, fetched {{ctrl.data.persist.data.response.docs.length | number}}\r\n            </div>\r\n         </div>\r\n      </div>\r\n   </nav>\r\n\r\n   <div class="pn-results">\r\n      <placenames-results-item ng-if="ctrl.data.persist.item" item="ctrl.data.persist.item"></placenames-results-item>\r\n      <div class="pn-results-list" ng-if="!ctrl.data.persist.item" ng-repeat="doc in ctrl.data.persist.data.response.docs">\r\n         <placenames-results-item item="doc"></placenames-results-item>\r\n      </div>\r\n   </div>\r\n</div>'),e.put("placenames/search/search.html",'<div class="pn-search-container">\r\n   <div ng-if="state.searched" placenames-results data="state"></div>\r\n   <div style="float:clear" ng-show="!state.searched">\r\n      <h4 style="font-size:12">Search by map location, partial name match or feature type</h4>\r\n      <div class="search-text">\r\n         <div class="input-group input-group-sm">\r\n            <span class="input-group-addon" id="names1">Filter:</span>\r\n\r\n            <input type="text" ng-model="state.filter" placeholder="Match by feature name..." ng-model-options="{ debounce: 300}"\r\n                  typeahead-on-select="select($item, $model, $label)" typeahead-template-url="placenames/search/typeahead.html"\r\n                  class="form-control" typeahead-min-length="0" uib-typeahead="doc as doc.name for doc in loadDocs(state.filter)"\r\n                  typeahead-loading="loadingLocations" typeahead-no-results="noResults" placenames-clear>\r\n\r\n            <span class="input-group-btn">\r\n            <button class="btn btn-primary" type="button" ng-click="search()" ng-disabled="!state.persist.data">Search</button>\r\n         </span>\r\n         </div>\r\n      </div>\r\n      <div>\r\n         <div ng-show="!(state.classifications | pnSomeSelected)" style="text-align:right"><strong>Found {{state.filtered.response.numFound | number}} features in map view.</strong></div>\r\n         <div ng-show="state.classifications | pnSomeSelected">\r\n            <strong style="float:right">Found {{state.filtered.response.numFound | number}} features</strong>\r\n            <span class="btn btn-primary btn-xs pnPill" ng-repeat="type in state.classifications | pnSelectedFacets" tooltip-append-to-body="true"\r\n               tooltip-placement="left" uib-tooltip="{{type.name}}">\r\n            <span style="max-width:100px;display:inline-block;" class="ellipsis">{{type.name}}</span>\r\n            <span style="max-width:100px;display:inline-block;" class="ellipsis">\r\n               ({{state.filtered.facetCounts[type.code].count?state.filtered.facetCounts[type.code].count:0}})\r\n               <a ng-click="deselect(type)" href="javascript:void(0)"><i class="fa fa-close fa-xs" style="color: white"></i></a>\r\n            </span>\r\n            </span>\r\n         </div>\r\n      </div>\r\n      <uib-accordion close-others="oneAtATime">\r\n         <div uib-accordion-group class="panel-default" is-open="status.open">\r\n            <uib-accordion-heading>\r\n               Filter by feature type...\r\n               <i class="pull-right glyphicon" ng-class="{\'glyphicon-chevron-down\': status.open, \'glyphicon-chevron-right\': !status.open}"></i>\r\n            </uib-accordion-heading>\r\n            <div ng-repeat="facet in state.classifications | pnUnselectedFacets" class="row">\r\n               <div class="col-md-12 ellipsis">\r\n                  <input type="checkbox" ng-model="facet.selected" ng-change="update(facet)" />\r\n                  <span tooltip-append-to-body="true" tooltip-placement="top-left" uib-tooltip="{{facet.name}}">\r\n                           <a target="_blank" href="http://www.google.com/search?q={{facet.name | pnClean}}">{{facet.name}}</a>\r\n                        </span>\r\n               </div>\r\n            </div>\r\n         </div>\r\n      </uib-accordion>\r\n   </div>\r\n</div>'),e.put("placenames/search/typeahead.html",'<a placenames-options ng-mouseenter="enter()" ng-mouseleave="leave()"  tooltip-append-to-body="true"\r\n               tooltip-placement="left" uib-tooltip-html="match.model | pnTooltip">\r\n   <span ng-bind-html="match.model.name | uibTypeaheadHighlight:query"></span>\r\n   (<span ng-bind-html="match.model.recordId"></span>)\r\n</a>'),e.put("placenames/toolbar/toolbar.html",'<div placenames-toolbar>\r\n\t<div class="row toolBarGroup">\r\n\r\n\t\t<div class="pull-right">\r\n\t\t\t<div class="btn-toolbar radCore" role="toolbar"  placenames-toolbar>\r\n\t\t\t\t<div class="btn-group">\r\n\t\t\t\t\t<!-- < icsm-state-toggle></icsm-state-toggle> -->\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\r\n\t\t\t<div class="btn-toolbar" style="margin:right:10px;display:inline-block">\r\n\r\n\t\t\t\t<div class="btn-group" title="Place names data density transparency">\r\n\t\t\t\t\t<span class="btn btn-default" common-baselayer-control max-zoom="16"></span>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>')}]);