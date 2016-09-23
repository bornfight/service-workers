var com = com || {};
com.degordian                       = com.degordian || {};
com.degordian.common                = com.degordian.common || {};
com.degordian.common.interfaces     = com.degordian.common.interfaces || {};
com.degordian.common.serviceWorkers = com.degordian.common.serviceWorkers || {};
com.degordian.common.helpers        = com.degordian.common.helpers || {};

(function(common){

    function extend(Child, Parent) {
        var F = function () {};
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.prototype.constructor = Child;
        Child.uber = Parent.prototype;
    }

    common.extend = extend;
})(com.degordian.common);

(function(common){
    /**
     * Main service worker. Receives defined workers and attaches them to events.
     * @param context
     * @constructor
     */
    function ServiceWorker(context) {
        this.context = context;
        this.workers = [];
    }

    Object.defineProperties(ServiceWorker.prototype, {
        registerWorker : {
            value : function(worker) {
                this.workers.push(worker);
            },
            enumerable : false
        },
        init : {
            value : function() {
                var self        = this;
                var fetchable   = [];
                var installable = [];
                var activable   = [];
                var syncable    = [];

                var interfaces = com.degordian.common.interfaces;
                for(var k in this.workers) {
                    var worker = this.workers[k];
                    if(worker instanceof interfaces.Fetchable) {
                        fetchable.push(worker);
                    } else if(worker instanceof interfaces.Installable) {
                        installable.push(worker);
                    } else if(worker instanceof interfaces.Activatable) {
                        activable.push(worker);
                    } else if(worker instanceof interfaces.Syncable) {
                        syncable.push(worker);
                    }
                }

                initRoutableWithRegex(fetchable, this.context, 'fetch', function(worker, event){
                    /**
                     * @type worker {com.degordian.common.interfaces.Fetchable}
                     */
                    worker.fetch(event);
                });
                initEventListeners(installable, this.context, 'install', function(worker, event){
                    /**
                     * @type worker {com.degordian.common.interfaces.Installable}
                     */
                    worker.install(event);
                });
                initEventListeners(activable, this.context, 'activate', function(worker, event){
                    /**
                     * @type worker {com.degordian.common.interfaces.Activable}
                     */
                    worker.activate(event);
                });
                initEventListeners(syncable, this.context, 'sync', function(worker, event){
                    /**
                     * @type worker {com.degordian.common.interfaces.Syncable}
                     */
                    worker.sync(event);
                });

                this.context.addEventListener('message', function(event){
                    if(event.data === "skipWaiting"){
                        self.context.skipWaiting();
                    };
                });

            },
            enumerable : false
        }
    });

    var initRoutableWithoutRegex = function(arr, context, eventName, callback) {
        var routes = {};
        for(var k in arr) {
            var arrRoutes = arr[k].getRoutes();
            for(var i in arrRoutes) {
                if(typeof arrRoutes[i] === "string"){
                    routes[arrRoutes[i]] = arr[k];
                }
            }
        }

        context.addEventListener(eventName, function(event) {
            if(typeof routes[event.request.url] != "undefined") {
                var worker = routes[event.request.url];
                callback(worker, event);
            }
        });
    };

    var initRoutableWithRegex = function(arr, context, eventName, callback) {
        var routes = {};
        var regExpRoutes = {};
        for(var k in arr) {
            var arrRoutes = arr[k].getRoutes();
            for(var i in arrRoutes) {
                if(arrRoutes[i] instanceof RegExp){
                    /**
                     * @type {RegExp}
                     */
                    var regex = arrRoutes[i];
                    regExpRoutes[regex] = arr[k];
                } else if(typeof arrRoutes[i] === "string"){
                    routes[arrRoutes[i]] = arr[k];
                }
            }
        }

        context.addEventListener(eventName, function(event) {
            if(typeof routes[event.request.url] != "undefined") {
                var worker = routes[event.request.url];
                callback(worker, event);
            } else {
                for(var k in regExpRoutes){
                    /**
                     * @type k {RegExp}
                     */
                    var eventUrl = event.request.url;
                    /**
                     * @type {RegExp}
                     */
                    var regex = k;
                    if(typeof k === "string") {
                        regex = eval(k); // When reloaded, objects in regExpRoutes are converted to strings.
                    }
                    if(regex.test(eventUrl)){
                        var worker = regExpRoutes[k];
                        callback(worker, event);
                        break;
                    }
                }
            }
        });
    };

    var initEventListeners = function(arr, context, eventName, callback){
        context.addEventListener(eventName, function(event){
            for(var k in arr){
                callback(arr[k], event);
            }
        });
    };
    common.ServiceWorker = ServiceWorker;

})(com.degordian.common);


/*********************************
 *********************************
 **                             **
 **   Interfaces definitions    **
 **                             **
 *********************************
 *********************************/
(function(interfaces){

    function Fetchable(routes) {
        this.routes = routes;
    }

    Object.defineProperties(Fetchable.prototype, {
        getRoutes : {
            value : function() {
                return this.routes;
            },
            enumerable : false
        },
        fetch : {
            value : function(event) {
                throw new Exception('You must implement method fetch.');
            },
            enumerable : false
        }
    });

    interfaces.Fetchable = Fetchable;
})(com.degordian.common.interfaces);


(function(interfaces){

    function Installable(routes) {
        this.routes = routes;
    }

    Object.defineProperties(Installable.prototype, {
        getRoutes : {
            value : function() {
                return this.routes;
            },
            enumerable : false
        },
        install : {
            value : function(event) {
                throw new Exception('You must implement method install.');
            },
            enumerable : false
        }
    });

    interfaces.Installable = Installable;
})(com.degordian.common.interfaces);

(function(interfaces){

    function Activatable() {

    }

    Object.defineProperties(Activatable.prototype, {
        activate : {
            value : function(event) {
                throw new Exception('You must implement method activate.');
            },
            enumerable : false
        }
    });

    interfaces.Activatable = Activatable;
})(com.degordian.common.interfaces);

(function(interfaces){

    function Pushable() {

    }

    Object.defineProperties(Pushable.prototype, {
        push : {
            value : function(event) {
                throw new Exception('You must implement method push.');
            },
            enumerable : false
        }
    });

    interfaces.Pushable = Pushable;
})(com.degordian.common.interfaces);

(function(interfaces){

    function Syncable(ids) {
        this.ids = ids;
    }

    Object.defineProperties(Syncable.prototype, {
        getIds : {
            value : function() {
                return this.ids;
            },
            enumerable : false
        },
        sync : {
            value : function(event) {
                throw new Exception('You must implement method sync.');
            },
            enumerable : false
        }
    });

    interfaces.Syncable = Syncable;
})(com.degordian.common.interfaces);


/*********************************
 *********************************
 **                             **
 **   Workers definitions       **
 **                             **
 *********************************
 *********************************/

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#on-install-as-a-dependency
     *
     * @param routes
     * @param cacheKey
     * @constructor
     */
    function OnInstallDependecy(routes, cacheKey) {
        this.routes = routes;
        this.cacheKey = cacheKey;
    }

    com.degordian.common.extend(OnInstallDependecy, com.degordian.common.interfaces.Installable);

    Object.defineProperties(OnInstallDependecy.prototype, {
        install : {
            value : function(event) {
                var self = this;
                event.waitUntil(
                    caches.open(self.cacheKey).then(function(cache) {
                        return cache.addAll(
                            self.routes
                        );
                    })
                );
            },
            enumerable : false
        }
    });

    workers.OnInstallDependecy = OnInstallDependecy;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#on-install-not-as-a-dependency
     *
     * @param dependentRoutes
     * @param nonDependentRoutes
     * @param cacheKey
     * @constructor
     */
    function OnInstallNoDependency(dependentRoutes, nonDependentRoutes, cacheKey) {
        this.dependentRoutes    = dependentRoutes;
        this.nonDependentRoutes = nonDependentRoutes;
        this.cacheKey           = cacheKey;
    }

    com.degordian.common.extend(OnInstallNoDependency, com.degordian.common.interfaces.Installable);

    Object.defineProperties(OnInstallNoDependency.prototype, {
        getRoutes : {
            value : function() {
                return this.dependentRoutes.concat(this.nonDependentRoutes);
            },
            enumerable : false
        },
        install : {
            value : function(event) {
                var self = this;
                event.waitUntil(
                    caches.open(self.cacheKey).then(function(cache) {
                        cache.addAll(
                            self.nonDependentRoutes
                        );
                        return cache.addAll(
                            self.dependentRoutes
                        );
                    })
                );
            },
            enumerable : false
        }
    });

    workers.OnInstallNoDependency = OnInstallNoDependency;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#on-activate
     *
     * @param caches
     * @constructor
     */
    function OnActivate(caches) {
        this.caches = caches;
    }

    Object.defineProperties(OnActivate.prototype, {
        activate : {
            value : function(event) {
                var self = this;
                event.waitUntil(
                    caches.keys().then(function(cacheNames) {
                        return Promise.all(
                            cacheNames.filter(function(cacheName) {
                                // Return true if you want to remove this cache,
                                // but remember that caches are shared across
                                // the whole origin
                                if(self.caches.indexOf(cacheName)) {
                                    return true;
                                }
                            }).map(function(cacheName) {
                                return caches.delete(cacheName);
                            })
                        );
                    })
                );
            },
            enumerable : false
        }
    });

    workers.OnActivate = OnActivate;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#on-network-response
     *
     * @param routes
     * @param cacheKey
     * @constructor
     */
    function OnNetworkResponseCache(routes, cacheKey) {
        this.routes = routes;
        this.cacheKey = cacheKey;
    }

    com.degordian.common.extend(OnNetworkResponseCache, com.degordian.common.interfaces.Fetchable);

    Object.defineProperties(OnNetworkResponseCache.prototype, {
        fetch : {
            value : function(event) {
                var self = this;
                event.respondWith(
                    caches.open(self.cacheKey).then(function(cache) {
                        return cache.match(event.request).then(function (response) {
                            return response || fetch(event.request).then(function(response) {
                                    cache.put(event.request, response.clone());
                                    return response;
                                });
                        });
                    })
                );
            },
            enumerable : false
        }
    });

    workers.OnNetworkResponseCache = OnNetworkResponseCache;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#stale-while-revalidate
     *
     * @param routes
     * @param cacheKey
     * @constructor
     */
    function StaleWhileRevalidate(routes, cacheKey) {
        this.routes = routes;
        this.cacheKey = cacheKey;
    }

    com.degordian.common.extend(StaleWhileRevalidate, com.degordian.common.interfaces.Fetchable);

    Object.defineProperties(StaleWhileRevalidate.prototype, {
        fetch : {
            value : function(event) {
                if(event.request.method != "GET") {
                    console.log("This method is " + event.request.method + " on request " + event.request.url);
                    return false;
                }

                var self = this;
                event.respondWith(
                    caches.open(self.cacheKey).then(function(cache) {
                        return cache.match(event.request).then(function(response) {
                            var fetchPromise = fetch(event.request).then(function(networkResponse) {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            }).catch(function(error){
                                // handle offline or server error

                            });
                            return response || fetchPromise;
                        })
                    })
                );
            },
            enumerable : false
        }
    });

    workers.StaleWhileRevalidate = StaleWhileRevalidate;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * Similar to StaleWhileRevalidate:
     *      - fetches from network, but puts to cache on response
     *      - if network fails, returns from cache
     *
     * @param routes
     * @param cacheKey
     * @constructor
     */
    function RevalidateWithCacheFallback(routes, cacheKey) {
        this.routes = routes;
        this.cacheKey = cacheKey;
    }

    com.degordian.common.extend( RevalidateWithCacheFallback, com.degordian.common.interfaces.Fetchable );

    Object.defineProperties(RevalidateWithCacheFallback.prototype, {
        fetch : {
            value : function(event) {
                if(event.request.method != "GET") {
                    console.log("This method is " + event.request.method + " on request " + event.request.url);
                    return false;
                }

                var self = this;
                event.respondWith(
                    caches.open(self.cacheKey).then(function(cache) {
                        return cache.match(event.request).then(function(response) {
                            return fetch(event.request).then(function(networkResponse) {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            }).catch(function(error){
                                // handle offline or server error
                                return response;
                            });
                        })
                    })
                );
            },
            enumerable : false
        }
    });

    workers.RevalidateWithCacheFallback = RevalidateWithCacheFallback;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#on-background-sync
     *
     * @param ids
     *  -> {"update-leaderboard" : ['/some-file.js', '/some-route']}
     * @param cacheKey
     * @constructor
     */
    function OnBackgroundSync(ids, cacheKey) {
        this.ids = ids;
        this.cacheKey = cacheKey;
    }

    com.degordian.common.extend( OnBackgroundSync, com.degordian.common.interfaces.Syncable);

    Object.defineProperties(OnBackgroundSync.prototype, {
        sync : {
            value : function(event) {
                if(typeof this.ids[event.id] !== "undefined"){
                    var self = this;
                    event.waitUntil(
                        caches.open(self.cacheKey).then(function(cache) {
                            return cache.addAll(self.ids[event.id]);
                        })
                    );
                }
            },
            enumerable : false
        }
    });

    workers.OnBackgroundSync = OnBackgroundSync;
})(com.degordian.common.serviceWorkers);


/*********************************************
 *********************************************
 **                                         **
 **   Workers definitions                   **
 **    - following are implementations      **
 **       of types of fetching from SW      **
 **                                         **
 *********************************************
 *********************************************/

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#cache-only
     *
     * @param routes
     * @constructor
     */
    function CacheOnly(routes) {
        this.routes = routes;
    }

    com.degordian.common.extend(CacheOnly, com.degordian.common.interfaces.Fetchable);

    Object.defineProperties(CacheOnly.prototype, {
        fetch : {
            value : function(event) {
                // If a match isn't found in the cache, the response
                // will look like a connection error
                event.respondWith(caches.match(event.request));
            },
            enumerable : false
        }
    });

    workers.CacheOnly = CacheOnly;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     *
     * @param routes
     * @constructor
     */
    function CacheFallingBackToNetwork(routes) {
        this.routes = routes;
    }

    com.degordian.common.extend( CacheFallingBackToNetwork, com.degordian.common.interfaces.Fetchable);

    Object.defineProperties(CacheFallingBackToNetwork.prototype, {
        fetch : {
            value : function(event) {
                event.respondWith(
                    caches.match(event.request).then(function(response) {
                        return response || fetch(event.request);
                    })
                );
            },
            enumerable : false
        }
    });

    workers.CacheFallingBackToNetwork = CacheFallingBackToNetwork;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#cache-network-race
     *
     * @param routes
     * @constructor
     */
    function CacheAndNetworkRace(routes) {
        this.routes = routes;
    }

    com.degordian.common.extend(CacheAndNetworkRace, com.degordian.common.interfaces.Fetchable);

    Object.defineProperties(CacheAndNetworkRace.prototype, {
        fetch : {
            value : function(event) {
                event.respondWith(
                    promiseAny([
                        caches.match(event.request),
                        fetch(event.request)
                    ])
                );
            },
            enumerable : false
        }
    });

    // Promise.race is no good to us because it rejects if
    // a promise rejects before fulfilling. Let's make a proper
    // race function:
    function promiseAny(promises) {
        return new Promise(function(resolve, reject){
           var promises = promises.map(function(p){
               Promise.resolve(p);
           });

            for(var k in promises) {
               promises[k].then(resolve);
            }

            promises.reduce(function(a, b){
                return a.catch(function(){
                    return b;
                }).catch(function(){
                    return reject(Error("All failed"));
                });
            });
        });

    };

    workers.CacheAndNetworkRace = CacheAndNetworkRace;
})(com.degordian.common.serviceWorkers);

(function(workers){

    /**
     * https://jakearchibald.com/2014/offline-cookbook/#network-falling-back-to-cache
     *
     * @param routes
     * @constructor
     */
    function NetworkFallingBackToCache(routes) {
        this.routes = routes;
    }

    com.degordian.common.extend( NetworkFallingBackToCache, com.degordian.common.interfaces.Fetchable );

    Object.defineProperties(NetworkFallingBackToCache.prototype, {
        fetch : {
            value : function(event) {
                event.respondWith(
                    fetch(event.request).catch(function() {
                        return caches.match(event.request);
                    })
                );
            },
            enumerable : false
        }
    });

    workers.NetworkFallingBackToCache = NetworkFallingBackToCache;
})(com.degordian.common.serviceWorkers);