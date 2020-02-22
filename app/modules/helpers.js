import {Gpx} from '../modules/gpx.js';
import {lineString} from '../../node_modules/@turf/helpers';

function formatPosition(position, extra={}) {
    return Object.assign({
        'timestamp': parseInt(position.timestamp) || new Date().getTime(),
        'coords': {
            'latitude': parseFloat(position.coords.latitude),
            'longitude': parseFloat(position.coords.longitude),
            'altitude': position.coords.altitude !== undefined? parseInt(position.coords.altitude): null,
            'accuracy': parseInt(position.coords.accuracy) || null,
            'altitudeAccuracy': parseInt(position.coords.altitudeAccuracy) || null,
            'heading': parseInt(position.coords.heading) || null,
            'speed': parseInt(position.coords.speed) || null,
        },
    }, extra);
}

function coordsToPosition(coords, accuracy, extra) {
    return Object.assign(formatPosition({
        coords: {
            'longitude': coords[0],
            'latitude': coords[1],
            'altitude': coords[2],
            'accuracy': accuracy,
        }
    }, extra));
}

export function buildPosition(point, accuracy) {
    return formatPosition(coordsToPosition([].concat(point), accuracy));
}

export function positionToCoords(position) {
    return [
        position.coords.longitude,
        position.coords.latitude
    ];
}

export function fileToGeojson(file) {
    return new Promise((resolve, reject) => {

        let reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            new Gpx().read(reader.result).then(gpx => {
                resolve(lineString(gpx.toGeojson().features[0].geometry.coordinates[0]));
            }).catch(reject);
        };
        reader.readAsText(file);
    });
}

export function serializeForm(form) {
    return Array.from(new FormData(form).entries()).reduce((result, field) => {
        result[field[0]] = field[1];
        return result;
    }, {});
}

export function toDMS(coordinate) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    // if i user floor conversion second by second gets stucked
    const seconds = Math.round((minutesNotTruncated - minutes) * 60);
    return [degrees, minutes, seconds];
}

export function lonToDMS(lon) {
    const dms = toDMS(lon);
    dms.push(lon >= 0? 'e': 'w')
    return dms;
}


export function latToDMS(lat) {
    const dms = toDMS(lat);
    dms.push(lat >= 0? 'n': 's')
    return dms;
}

export function toDD(degrees, minutes, seconds, direction) {   
    var dd = Number(degrees) + Number(minutes)/60 + Number(seconds)/(60*60);

    if (direction == 's' || direction == 'w') {
        dd = dd * -1;
    }

    return dd;
}
