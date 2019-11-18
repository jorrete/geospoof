/* global ol */

const homeCoordinates = [-0.3765, 39.47];

let view = new ol.View({
    center: ol.proj.fromLonLat(homeCoordinates),
    zoom: 18,
});

let map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        })
    ],
    view: view,
});

let positionFeature = new ol.Feature({
    // geometry: new ol.geom.Point(ol.proj.fromLonLat(homeCoordinates)),
});
positionFeature.setStyle(new ol.style.Style({
    image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
            color: '#ff0000'
        }),
        stroke: new ol.style.Stroke({
            color: '#fff',
            width: 2
        })
    })
}));

let accuracyFeature = new ol.Feature({
    // geometry: new ol.geom.Circle(ol.proj.fromLonLat(homeCoordinates), 20),
})
accuracyFeature.setStyle(new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'red',
        width: 1
    }),
    fill: new ol.style.Fill({
        color: 'rgba(255, 0, 0, 0.3)'
    })
}));


new ol.layer.Vector({
    map: map,
    projection: 'EPSG:4326',
    source: new ol.source.Vector({
        features: [accuracyFeature, positionFeature]
    }),
});

function log(origin, position) {
    let info = position? `${position.coords.longitude} ${position.coords.latitude} ${position.coords.accuracy}`: '';
    document.getElementById('console').innerHTML += `<div>[${origin}] ${info}</div>`;

    if (position) {
        let coords = [position.coords.longitude, position.coords.latitude];
        positionFeature.setGeometry(new ol.geom.Point(ol.proj.fromLonLat(coords)));
        accuracyFeature.setGeometry(new ol.geom.Circle(ol.proj.fromLonLat(coords), position.coords.accuracy));

        map.getView().setCenter(ol.proj.transform(coords, 'EPSG:4326', 'EPSG:3857'));
    } else {
        positionFeature.setGeometry(null);
        accuracyFeature.setGeometry(null);
    }
}

document.getElementById('get').addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(position => {
        log('get', position);
    }, console.error, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
});

let id;

document.getElementById('start').addEventListener('click', () => {
    navigator.geolocation.clearWatch(id);
    id = navigator.geolocation.watchPosition(position => {
        log('watch', position);
    }, console.error, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    });
});

document.getElementById('stop').addEventListener('click', () => {
    if (id !== undefined) {
        log('clear');
    }
    navigator.geolocation.clearWatch(id);
    id = null;
});
