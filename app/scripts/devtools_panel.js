import {StatusApp} from '../../app/modules/status';
import ua from '../modules/ua.js';

const isTab = browser.devtools.inspectedWindow.tabId !== undefined;
const port = browser.runtime.connect({
    name: `devtools${isTab? `_${browser.devtools.inspectedWindow.tabId}`: ''}`,
});

// firefox has an event, chrome reloads everything
let setTheme = theme => {
    theme = theme === 'dark'? 'dark': 'light';
    console.log('[devtools_panel][theme]', theme , ua);
    document.documentElement.setAttribute('theme', theme);
    document.documentElement.setAttribute('browser', ua);
};

if (browser.devtools.panels.onThemeChanged) {
    browser.devtools.panels.onThemeChanged.addListener(setTheme);
}

setTheme(browser.devtools.panels.themeName);

function init() {
    let status, position, timestamp;

    const getCurrentPosition = navigator.geolocation.getCurrentPosition,
          watchPosition = navigator.geolocation.watchPosition,
          clearWatch = navigator.geolocation.clearWatch;


    const isConnected = function () {
        return (new Date() - timestamp) < 1200;
    };

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
        get fake () {
            return true;
        }

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
                if (isConnected) {
                    success(position);
                } else {
                    this.clearInterval();
                    error(new PositionError());
                }
            }, 1000);
        }

        clearWatch(id) {
            clearInterval(id);
        }
    };

    Object.assign(navigator.geolocation, {
        getCurrentPosition: function () {
            (isConnected() && status?
                geolocation_fake.getCurrentPosition.bind(geolocation_fake):
                getCurrentPosition.bind(navigator.geolocation)
            )(...arguments);
        },
        watchPosition: function () {
            return (isConnected() && status?
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
        tickTimestamp: function () {
            timestamp = new Date();
        }
    })
    console.log('[Geospoof][init]', navigator.geolocation);
}

function inject() {
    browser.devtools.inspectedWindow.eval(`(${init})();`);
}

function setStatus(status) {
    port.postMessage({
        status: status,
    });
    browser.devtools.inspectedWindow.eval(`navigator.geolocation.setStatus(${status})`);
}

function setPosition(position) {
    browser.devtools.inspectedWindow.eval(`navigator.geolocation.setPosition(${JSON.stringify(position)})`);
}

function tickTimestamp() {
    browser.devtools.inspectedWindow.eval('navigator.geolocation.tickTimestamp()');
}

browser.storage.local.get().then(storage => {
    document.getElementById('enabled').checked = storage.initial || false;

    const status = new StatusApp({
        url: storage.tiles_url || '',
        coords: [storage.longitude || 0, storage.latitude || 0],
        onupdate: position => {
            setStatus(document.getElementById('enabled').checked);
            setPosition(position);
        },
    });


    browser.storage.onChanged.addListener(storage => {
        if (storage.tiles_url.newValue !== storage.tiles_url.oldValue) {
            status.map.setUrl(storage.tiles_url.newValue);
        }
    });

    document.getElementById('settings').addEventListener('click', () => {
        port.postMessage({
            settings: true,
        });
    });

    if (storage.tiles_url === undefined) {
        port.postMessage({
            settings: true,
        });
    }

    if (storage.initial === true) {
        setStatus(true);
    }

    port.onMessage.addListener(() => {
        document.getElementById('status').click();
    });

    setInterval(() => {
        tickTimestamp();
    }, 1000);


    document.getElementById('enabled').addEventListener('change', () => {
        setStatus(document.getElementById('enabled').checked);
    });
});

browser.devtools.network.onNavigated.addListener(inject);
inject();
