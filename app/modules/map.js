import Map from '../../node_modules/ol/Map';
import View from '../../node_modules/ol/View';
import TileLayer from '../../node_modules/ol/layer/Tile';
import OSM from '../../node_modules/ol/source/OSM';
import {fromLonLat, toLonLat} from '../../node_modules/ol/proj';
import {Modify, Snap} from '../../node_modules/ol/interaction';
import {Vector as VectorLayer} from '../../node_modules/ol/layer';
import {Vector as VectorSource} from '../../node_modules/ol/source';
import {Circle as CircleStyle, Fill, Stroke, Style} from '../../node_modules/ol/style';
import {Point} from '../../node_modules/ol/geom';
import Feature from '../../node_modules/ol/Feature';
import GeoJSON from '../../node_modules/ol/format/GeoJSON';
import {defaults as defaultControls, ScaleLine, Control} from 'ol/control';
import {defaults as defaultInteractions, DragRotateAndZoom} from 'ol/interaction';

class RotateNorthControl extends Control {
    constructor(options={}) {
        const button = document.createElement('button');
        button.innerHTML = '&#8226;';

        const element = document.createElement('div');
        element.className = 'ol-center ol-unselectable ol-control';
        element.appendChild(button);

        button.addEventListener('click', () => {
            options.onclick();
        }, false);

        super({
            element: element,
        })
    }
}

export function initMap(options={}) {
    let pointSource = new VectorSource({
        features: [
            new Feature({
                geometry: new Point(fromLonLat(options.initialCoordinates)),
            }),
        ],
    });

    let source = new OSM({
        url: options.url || '',  // dont let undefined because it will use default
    });

    let trackSource =  new VectorSource();

    let map = new Map({
        target: 'map',
        interactions: defaultInteractions().extend([
            new DragRotateAndZoom(),
        ]),
        controls: defaultControls().extend([
            new ScaleLine({
                units: 'metric',
                bar: true,
                steps: 4,
                text: true,
                minWidth: 140
            }),
            new RotateNorthControl({
                onclick: () => {
                    const pointFeature = pointSource.getFeatures()[0];
                    map.getView().setCenter(pointFeature.values_.geometry.flatCoordinates);
                },
            }),
        ]),
        layers: [
            new TileLayer({
                source: source,
            }),
            new VectorLayer({
                source: trackSource,
                style: new Style({
                    stroke: new Stroke({
                        color: 'magenta',
                        width: 2
                    }),
                })
            }),
            new VectorLayer({
                source: pointSource,
                style: new Style({
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new CircleStyle({
                        radius: 7,
                        fill: new Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            }),
        ],
        view: new View({
            center: fromLonLat(options.initialCoordinates),
            zoom: 15,
        })
    });

    let modify = new Modify({source: pointSource});
    modify.on('modifyend', function (event){
        const coords = event.features.getArray()[0].getGeometry().getCoordinates();
        options.onchange(toLonLat(coords));
    });
    modify.on('modifystart', function (event){
        const coords = event.features.getArray()[0].getGeometry().getCoordinates();
        options.ongrab(toLonLat(coords));
    });
    map.addInteraction(modify);

    map.addInteraction(new Snap({source: pointSource}));

    map.addInteraction(new Snap({source: trackSource}));

    window.onresize = function () {
        map.updateSize();
    }

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            map.updateSize();
        }, 1000);
    });

    return {
        updatePosition: function (position) {
            const pointFeature = pointSource.getFeatures()[0];
            pointFeature.setGeometry(new Point(fromLonLat([position.coords.longitude, position.coords.latitude])));
        },
        center: function (position) {
            map.getView().setCenter(fromLonLat([position.coords.longitude, position.coords.latitude]));
        },
        loadTrack: function (geojson2) {
            trackSource.clear();
            let feature = (new GeoJSON()).readFeatures(geojson2)[0];
            feature.setGeometry(feature.getGeometry().transform('EPSG:4326', 'EPSG:3857'))
            trackSource.addFeature(feature);
        },
        clearTrack: function () {
            trackSource.clear();
        },
        setUrl: function (url) {
            console.log('setUrl', url);
            source.setUrl(url);
        }
    }
}
