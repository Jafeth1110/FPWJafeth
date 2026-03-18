if('serviceWorker' in navigator){
    navigator.serviceWorker.register('/serviceworker.js')
    .then(reg=>{
        console.log('Service Worker se ha instalado correctamente. Scope: ', reg.scope)
    }

    ).catch(err=>{
        console.log('Error al instalar el Service Worker: ', err)
    })
}else{
    console.log('Este navegador no soporta Service Workers')
}