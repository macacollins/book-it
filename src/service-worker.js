console.debug("Network Cache Service worker is initializing.");

const cacheName = 'book-it-cache';
const filesToCache = [
  '/',
  '/index.html',
  '/book-it/',
  '/book-it'
];

// the event handler for the activate event
self.addEventListener('activate', e => {
    console.debug("Hit activate event");

    try {
        self.clients.claim()
    } catch (e) {
        console.debug("encountered exception during activate ", e);
    }
});

// the event handler for the install event 
// typically used to cache assets
self.addEventListener('install', e => {
    console.log("Hit install event");
    try {
        e.waitUntil(
            caches.open(cacheName)
            .then(cache => cache.addAll(filesToCache))
          );
    } catch (e) {
        console.log("Failed during install", e);
    }

});


async function cacheThenNetwork(request) {
    try {
        console.debug(request);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          console.debug("Found response in cache:", cachedResponse);
          return cachedResponse;
        }
        console.debug("service worker cache miss")
    } catch (e) {
        console.debug("Got e.", e);
    }

    console.debug("Falling back to network");
    return fetch(request);
  }
  
  self.addEventListener("fetch", (event) => {
    console.debug(`Handling fetch event for ${event.request.url}`);
    event.respondWith(cacheThenNetwork(event.request));
  });
  