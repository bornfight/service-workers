var com = com || {};
com.degordian                       = com.degordian || {};
com.degordian.common                = com.degordian.common || {};
com.degordian.common.interfaces     = com.degordian.common.interfaces || {};
com.degordian.common.serviceWorkers = com.degordian.common.serviceWorkers || {};
com.degordian.common.helpers        = com.degordian.common.helpers || {};

(function(helpers){
    function ServiceWorker(filepath) {
        this.filepath = filepath;
    }


    Object.defineProperties(ServiceWorker.prototype, {
        register : {
            value : function(){
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register(this.filepath).then(function(registration) {
                        // Registration was successful
                    }).catch(function(err) {
                        // registration failed :(
                    });

                    navigator.serviceWorker.getRegistration().then(
                        function(registration) {
                            if(typeof registration !== "undefined") {
                                if(registration.waiting) {
                                    registration.waiting.postMessage('skipWaiting');
                                }
                            }
                        }
                    )

                }
            },
            enumerable : false
        }
    });


    helpers.ServiceWorker = ServiceWorker;
})(com.degordian.common.helpers);