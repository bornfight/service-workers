/*
 * Path to the service-workers.js file
 */
importScripts('/path/to/service-workers.js');

var baseUrl = "https://your.base.url";
var context = self;
var version = "1";
var cacheKey = "cache" + version;

var worker = new com.degordian.common.ServiceWorker(self);

// Worker definitions

worker.registerWorker(
    new com.degordian.common.serviceWorkers.OnInstallDependecy([
        baseUrl + "static/js/app.js",
        baseUrl + "static/js/main.js",
    ])
);

worker.registerWorker(
    new com.degordian.common.serviceWorkers.CacheFallingBackToNetwork([
        /main\.js$/,
        /app\.js$/,
        /sdk\.js$/
    ])
);

worker.registerWorker(
    new com.degordian.common.serviceWorkers.StaleWhileRevalidate([
        /\.(png|jpg|jpeg|gif)$/,
        /gtm\.js/,
    ])
);

// Initialize worker
worker.init();