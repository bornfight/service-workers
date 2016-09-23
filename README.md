# Service workers

Simple helper library for working with service workers. There are two main things that need to be remembered:

1. SSL is a requirement.
2. You have scoped access, so your *worker.js* needs to be in your root.
 
## Main thread
 
 On your main thread, you need to include *main-thread/ServiceWorker.js*.
 
 After that, just register your worker with new object.
 
 ```javascript
 (function(){
 
     var worker = new com.degordian.common.helpers.ServiceWorker('/worker.example.js');
     worker.register();
 
 })();
 ```
 
 That's it on your main thread.
 
 
## Service worker thread
 
 There are few things that need to be done on this thread:
 1. Include workers definitions.
 2. Initialize new worker.
 3. Set definitions.
 
 

Definition of workers is in *service-workers.js* file.
 ```javascript
 importScripts('/path/to/service-workers.js');
 ```

It's good practice to set constants for further usage. Also, don't forget to pass context to worker.
 ```javascript
 var baseUrl = "https://your.base.url";
 var context = self;
 var version = "1";
 var cacheKey = "cache" + version;
 
 var worker = new com.degordian.common.ServiceWorker(self);
 
 // Worker definitions
 // TODO: wiil be filled
 
 // Initialize worker
 worker.init();
 ```
 
Worker defined like this knows how to work with following interfaces:
 1. _**Installable**_
 2. _**Activable**_
 3. _**Fetchable**_
 4. _**Syncable**_
 
_**Pushable**_ will be added in future builds. Each of this represent a single event in life cycle.

All interfaces have _getRoutes_ function and if there is a match with an event, worker will be called and _event_ object will be passed to it. 
 
**ONLY FETCHABLE KNOW HOW TO DEAL WITH REGEX!**
 
There is a certain amount of implemented content serving methods.
 Here is a list of those implemented.
 
 Worker name | Constructor | Description | Interfaces
  ---------- | ----------- | ----------- | ----------
  OnInstallDependency | (routes, cacheKey) | Provided routes will be fetched and cached during the install event. If any of these fails, worker will not be installed. | _**Installable**_
  OnInstallNoDependency | (dependentRoutes, nonDependentRoutes, cacheKey) | Similar to OnInstallDependency, with extra of non dependent files (if fetching those fails, worker will still install) | _**Installable**_
  OnActivate | (caches) | Responsible for cache clearing. If cache name is not provided in caches, it will be deleted.  | _**Activable**_
  OnNetworkResponseCache | (routes, cacheKey) | Returns from cache. If there is no match in cache, network request is normally done. On it's completion, response is cached for further usage. | _**Fetchable**_
  StaleWhileRevalidate | (routes, cacheKey) | If there is a cache match, respond to event with that and make a request to network and upon completion cache it. If there is no cache, standard network request. | _**Fetchable**_
  RevalidateWithCacheFallback | (routes, cacheKey) | Do a network request and cache on success. On failure, return match from cache. | _**Fetchable**_
  OnBackgroundSync | (ids, cacheKey) | When sync event is triggered, put to cache all with event id. | _**Syncable**_
  CacheOnly | (routes) | Fetch only from cache | _**Fetchable**_
  CacheFallingBackToNetwork | (routes) | Get from cache if there is a match, otherwise standard network request (with no cache at response) | _**Fetchable**_
  CacheAndNetworkRace | (routes) | Which ever responds first with success. | _**Fetchable**_
  NetworkFallingBackToCache | (routes) | If there is network, standard network request. If there is no network, get a match from cache. | _**Fetchable**_
  
  
  Here are two examples for working with strings and regular expressions:
  

```javascript
worker.registerWorker(
    new com.degordian.common.serviceWorkers.OnInstallDependecy([
        baseUrl + "static/js/app.js",
        baseUrl + "static/js/main.js",
    ])
);
```
```javascript
worker.registerWorker(
    new com.degordian.common.serviceWorkers.CacheFallingBackToNetwork([
        /main\.js$/,
        /app\.js$/,
        /sdk\.js$/
    ])
);
```


Final _worker.js_ example:
```javascript
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
```
