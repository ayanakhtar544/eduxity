// service-worker.js

// Jab bhi background mein push notification aayega, ye chalega
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Notification';
  
  const options = {
    body: data.body || 'You have a new message in Eduxity.',
    // Agar aapke paas koi logo hai toh uska path yahan de sakte hain
    icon: '/favicon.ico', 
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Service worker ko jaldi activate karne ke liye (Senior dev best practice)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});