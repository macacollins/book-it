console.log("Service worker is initializing.");

const cacheName = 'book-it-cache';
const filesToCache = [
  '/',
  '/index.html',
  '/book-it/',
  '/book-it'
];

// the event handler for the activate event
self.addEventListener('activate', e => {
    console.log("Hit activate event");

    try {
        self.clients.claim()
    } catch (e) {
        console.log("encountered exception during activate ", e);
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

// the fetch event handler, to intercept requests and serve all 
// static assets from the cache
self.addEventListener('fetch', e => {
    try {
        e.respondWith(
            caches.match(e.request)
            .then(response => response ? response : fetch(e.request))
          )
    } catch (e) {
        console.log("Got exception during fetch event", e);
    }

});