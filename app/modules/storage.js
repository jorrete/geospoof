import {buildPosition} from '../modules/helpers.js';

const SERVER_URL = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const COORDS = [-0.3303, 39.46118];
const isDev = process.env.NODE_ENV === 'development';

export function getStorage() {
    return browser.storage.local.get().then(storage => {
        // default settings
        return browser.storage.local.set(Object.assign(storage, {
            tiles_url: storage.tiles_url !== undefined? storage.tiles_url: isDev? SERVER_URL: '',
            initial: storage.initial !== undefined? storage.initial: false,
            longitude: storage.longitude !== undefined? storage.longitude: isDev? COORDS[0]: 0,
            latitude: storage.latitude !== undefined? storage.latitude: isDev? COORDS[1]: 0,
            accuracy: storage.accuracy !== undefined? storage.accuracy: 5,
            altitude: storage.altitude !== undefined? storage.altitude: 0,
        })).then(() => {
            return browser.storage.local.get();
        });
    });
}

export function setStorage(data={}) {
    return getStorage().then(storage => {
        return browser.storage.local.set(Object.assign(storage, data));
    });
}

export function getOptions() {
    return getStorage().then(storage => {
        return {
            position: buildPosition([storage.longitude, storage.latitude], storage.accuracy),
            status: storage.initial,
        };
    });
}
