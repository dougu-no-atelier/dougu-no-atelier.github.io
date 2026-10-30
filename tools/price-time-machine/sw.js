'use strict';
const PREFIX='price-memories:'+self.registration.scope+':';
const CACHE=PREFIX+'980aca1e37e4973b';
const SHELL=['./','index.html','styles.css','core.js','catalog.js','app.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
const scope=new URL(self.registration.scope);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 const relative=url.pathname.slice(scope.pathname.length);
 if(event.request.mode==='navigate'){
  if(!['','index.html'].includes(relative))return;
  event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',scope).href)).then(cached=>cached||fetch(event.request)));
  return;
 }
 if(!SHELL.includes(relative)&&!/^assets\/[a-z0-9-]+\.png$/.test(relative))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(event.request);if(cached)return cached;
  const response=await fetch(event.request);
  if(response.ok&&response.type==='basic')await cache.put(event.request,response.clone());
  return response;
 }));
});
