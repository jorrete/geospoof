import {buildPosition} from '../modules/helpers.js';

const TIMEOUT = 5000;
const SERVER_URL = 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const COORDS = [-0.3303, 39.46118];
const isDev = process.env.NODE_ENV === 'development';
const isTab = browser.devtools.inspectedWindow.tabId !== undefined;
const port = browser.runtime.connect({
    name: `devtoolspage${isTab? `_${browser.devtools.inspectedWindow.tabId}`: ''}`,
});

function init(options) {
    // let timestamp = new Date(),
    let position = options.position,
        status = options.status;


    const getCurrentPosition = navigator.geolocation.getCurrentPosition,
          watchPosition = navigator.geolocation.watchPosition,
          clearWatch = navigator.geolocation.clearWatch;


    // const isConnected = function () {
    //     return (new Date() - timestamp) < 1200;
    // };

    const errors = {
        '1': 'PERMISSION_DENIED',
        '2': 'POSITION_UNAVAILABLE',
        '3': 'TIMEOUT',
    };

    class PositionError extends Error {
        constructor(options={}) {
            const code = options.code || 2;
            const message = options.message || errors[`${code}`];
            super(message);
            this.code = code;
            this.message = message;
        }
    }

    const geolocation_fake = new class {
        constructor() {
            console.log('[geolocation][fake]', this);
        }

        getCurrentPosition(success, error) {
            if (!position) {
                return error(new PositionError());
            }

            success(position);
        }

        watchPosition(success, error) {
            if (!position) {
                return error(new PositionError());
            }

            return setInterval(() => {
                success(position);
            }, TIMEOUT);
        }

        clearWatch(id) {
            clearInterval(id);
        }
    };

    Object.assign(navigator.geolocation, {
        getCurrentPosition: function () {
            return (status?
                geolocation_fake.getCurrentPosition.bind(geolocation_fake):
                getCurrentPosition.bind(navigator.geolocation)
            )(...arguments);
        },
        watchPosition: function () {
            return (status?
                geolocation_fake.watchPosition.bind(geolocation_fake):
                watchPosition.bind(navigator.geolocation)
            )(...arguments);
        },
        clearWatch: function () {
            geolocation_fake.clearWatch.bind(geolocation_fake)(...arguments);
            clearWatch.bind(navigator.geolocation)(...arguments);
        },
        setStatus: function (newStatus) {
            status = Boolean(newStatus);
        },
        setPosition: function (newPosition) {
            position = newPosition;
        },
        isFake: function () {
            return status;
        }
    })
    console.log('[Geospoof][init]', options, navigator.geolocation);
}

export function inject() {
    browser.storage.local.get().then(storage => {
        // default settings
        storage = Object.assign(storage, {
            tiles_url: storage.tiles_url !== undefined? storage.tiles_url: isDev? SERVER_URL: '',
            initial: storage.initial !== undefined? storage.initial: true,
            longitude: storage.longitude !== undefined? storage.longitude: isDev? COORDS[0]: '',
            latitude: storage.latitude !== undefined? storage.latitude: isDev? COORDS[1]: '',
            accuracy: storage.accuracy !== undefined? storage.accuracy: 5,
        })

        browser.storage.local.set(storage).then(() => {
            const options = {
                position: buildPosition([storage.longitude, storage.latitude], storage.accuracy),
                status: storage.initial || false,
            };

            port.postMessage({
                status: options.status,
            });

            browser.devtools.inspectedWindow.eval(`(${init})(${JSON.stringify(options)});`);
        });
    });
}
