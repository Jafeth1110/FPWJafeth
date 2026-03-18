/**CICLO DE VIDA DEL SERVICE WORKER 
 * Etapas:
 * 1- Instalación
 * 2- Espera de activación
 * 3- Activo -> fetch/sync/push
*/

//CACHES
const CACHE_STATIC_NAME = 'static-v1'
const CACHE_DYNAMIC_NAME = 'dynamic-v1'
const CACHE_IMMUTABLE_NAME = 'immutable-v1'
const MAX_CACHE_ITEMS = 50

//ETAPA DE INSTALACIÓN
self.addEventListener('install', event =>{
    console.log("Service Worker en proceso de instalación")
    /**Cache estatico lo usamos para almacenar archivos estaticos del sitio */
    const cacheStatic = caches.open(CACHE_STATIC_NAME)
        .then(cache=>{
            return cache.addAll([
                './',
                './index.html',
                './css/style.css',
                './js/script.js',
                './img/no-image.png'
                /**Agregar imagenes */
            ])
        })
        /**Cache inmutable se utiliza para assets de terceros */

        
    const cacheImmutable = caches.open(CACHE_IMMUTABLE_NAME)
        .then(cache=>{
            return cache.addAll([
                'https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css',
              //  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css'
            ])
        })

    event.waitUntil(
        Promise.all([cacheImmutable,cacheStatic]).then(()=>{
            console.log('Instalacion completa')
            console.log('Nueva version')
            self.skipWaiting() //Forzamos al SW a activarse inmediatamente despues de la instalación
        })
    )
        
})

self.addEventListener('activate', event =>{
    console.log("Service Worker activo")
    const validCaches = [CACHE_STATIC_NAME, CACHE_DYNAMIC_NAME, CACHE_IMMUTABLE_NAME]
    event.waitUntil(
        caches.keys().then(
            keys=>Promise.all(
                keys.filter(k=> !validCaches.includes(k))
                .map(k=>{
                    return caches.delete(k)
                })
            )
        )
    )

})

function clearCache(cacheName, maxItems){
    caches.open(cacheName).then(
        cache=>{
            return cache.keys().then(
                keys=>{
                    if(keys.length > maxItems){
                        cache.delete(keys[0]).then(
                            ()=>clearCache(cacheName, maxItems)
                        )
                    }
                }
            )
        }
    )
}

// EVENTOS QUE CAPTURA EL SW
//**FETCH */
self.addEventListener('fetch', event =>{
    /**TODO: filtrar el metodo de la peticion HTTP */
    /**ESTRATEGIAS MANEJO DE CACHE
     * 1- CACHE ONLY -> Nunca va a la red --- solo durante el proceso de instalación
     * 2- CACHE FIRST -> Ir primero al cache y posterior a la red como un fallback
     * 3- NETWORK WITH CACHE UPDATE -> Contenido mas actualizado
     * 4- NETWORK AND CACHE RACE -> Ir a la red y al cache al mismo tiempo, se muestra lo que responda primero
     * 5- NETWORK ONLY -> Siempre va a la red
     */


    //CACHE ONLY
  /*  event.respondWith(
        caches.match(event.request)
    )*/


   //CACHE FIRST
   /* event.respondWith(
        caches.match(event.request).then( resp=>{
            if(resp) return resp
            return fetch(event.request).then(newResp=>{
                caches.open(CACHE_DYNAMIC_NAME).then(cache=>{
                    cache.put(event.request, newResp)
                })
                return newResp.clone()
            })
        })
    )*/


   //NETWORK FIRST
   /* event.respondWith(
        fetch(event.request).then(resp=>{
            caches.open(CACHE_DYNAMIC_NAME).then(cache=>{
                cache.put(event.request, resp)
                clearCache(CACHE_DYNAMIC_NAME, MAX_CACHE_ITEMS) //Limitar el numero de items en cache dinamico
            })
            return resp.clone()
        }).catch(()=>
            caches.match(event.request)
        )
    )*/

       
    //NETWORK ONLY
    const response = new Promise((resolve, reject)=>{
        let resolved = false
        const tryFallback = () =>{
            if(resolved) return
            resolved = true
            if(/\.(png|jpg|jpeg|webp)$/i.test(event.request.url)){
                resolve(caches.match('/img/no-image.png'))
            }else{
                reject(new Error('Sin respuesta de la red ni del cache'))
            }
        }
        fetch(event.request).then(resp=>{
            if(!resolved){
                resolved = true
                resolve(resp)
            }
        }).catch(tryFallback)
        caches.match(event.request).then(resp=>{
            if(!resolved && resp){
                resolved = true
                resolve(resp)
            }
        }).catch(tryFallback)
    })

    event.responseWith(response) 

})

//**PUSH NOTIFICATIONS */
self.addEventListener('push', event =>{
    console.log(event.data.text())
})

//**SYNC -- RECUPERA LA CONECTIVIDAD*/
self.addEventListener('sync', event =>{
    if(event.tag === 'sync-add-task'){
        console.log('Sincronizando la agregacion de tareas al server...')
    }
})

