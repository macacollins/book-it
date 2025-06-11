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


async function cacheThenNetwork(request) {

    console.log(request);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log("Found response in cache:", cachedResponse);
      return cachedResponse;
    }
    console.log("Falling back to network");
    return fetch(request);
  }
  
  self.addEventListener("fetch", (event) => {
    console.log(`Handling fetch event for ${event.request.url}`);
    event.respondWith(cacheThenNetwork(event.request));
  });
  