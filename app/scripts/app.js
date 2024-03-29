'use strict';

// Application configurations.

angular.module('autoNetApp', [
  'ngAnimate',
  'ngRoute',
  'ngSanitize',
  'ui.bootstrap'
])

// Constants and Values
.constant('info', {
  version: '0.0.17',
  deploy_date: '7/25/14',
  websocket_port: 8000
})

//Configurations
.config(['$routeProvider', function ($routeProvider) {
  $routeProvider
    .when('/main', {
      templateUrl: 'views/main.html',
      controller: 'MainCtrl'
    })
    .when('/edit', {
      templateUrl: 'views/edit.html',
      controller: 'EditCtrl'
    })
    .when('/raw', {
      templateUrl: 'views/raw.html',
      controller: 'RawCtrl'
    })
    .when('/filtergraph', {
      templateUrl: 'views/filtergraph.html',
      controller: 'FilterGraphCtrl'
    })
    .when('/object/:contextID/:objName', {
      templateUrl: 'views/object.html',
      controller: 'ObjectCtrl'
    })
    .when('/context/:contextID', {
      templateUrl: 'views/context.html',
      controller: 'ContextCtrl'
    })
    .otherwise({
      redirectTo: '/main'
    });
}]);
