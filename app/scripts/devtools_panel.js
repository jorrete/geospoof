import ua from '../modules/ua.js';
import {StatusApp} from '../../app/modules/status';
import {getStorage, getOptions, setStorage} from '../modules/storage.js';
import {positionToCoords} from '../../app/modules/helpers';

const isTab = browser.devtools.inspectedWindow.tabId !== undefined;
const port = browser.runtime.connect({
    name: `devtoolspanel${isTab? `_${browser.devtools.inspectedWindow.tabId}`: ''}`,
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
let _status = false;
function setStatus(status) {
    status = status === undefined? _status: status;
    port.postMessage({
        status: status,
    });
    browser.devtools.inspectedWindow.eval(`navigator.geolocation.setStatus(${status})`);
    _status = status;
}

let _position = undefined;
function setPosition(position) {
    position = position === undefined? _position: position;
    browser.devtools.inspectedWindow.eval(`navigator.geolocation.setPosition(${JSON.stringify(position)})`);
    _position = position;
}

Promise.all([
    getStorage(),
    getOptions(),
]).then(([storage, options]) => {
    _position = options.position;
    _status = options.status;

    document.getElementById('enabled').checked = storage.initial;
    document.getElementById('accuracy_num').value = storage.accuracy;

    const status = new StatusApp({
        url: storage.tiles_url || '',
        coords: [storage.longitude, storage.latitude],
        onupdate: position => {
            setPosition(position);
        },
    });

    setTimeout(() => {
        status.resizeMap();
    }, 1000);

    browser.storage.onChanged.addListener(storage => {
        if (storage.tiles_url.newValue && storage.tiles_url.newValue !== storage.tiles_url.oldValue) {
            status.map.setUrl(storage.tiles_url.newValue);
        }
    });

    document.getElementById('settings').addEventListener('click', () => {
        port.postMessage({
            settings: true,
        });
    });

    if (!storage.tiles_url) {
        port.postMessage({
            settings: true,
        });
    }

    document.getElementById('enabled').addEventListener('change', () => {
        setStatus(document.getElementById('enabled').checked);
    });

    document.getElementById('save').addEventListener('click', () => {
        console.log('save!!');
        const coords = positionToCoords(_position);
        setStorage({
            longitude: coords[0],
            latitude: coords[1],
            accuracy: document.getElementById('accuracy_num').value
        })
    });
});

browser.devtools.network.onNavigated.addListener(() => {
    setStatus();
    setPosition();
});
