import {StatusApp} from '../../app/modules/status';
import {positionToCoords} from '../../app/modules/helpers';
import ua from '../modules/ua.js';

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


function setStatus(status) {
    port.postMessage({
        status: status,
    });
    browser.devtools.inspectedWindow.eval(`navigator.geolocation.setStatus(${status})`);
}

function setPosition(position) {
    browser.devtools.inspectedWindow.eval(`navigator.geolocation.setPosition(${JSON.stringify(position)})`);
}

browser.storage.local.get().then(storage => {
    document.getElementById('enabled').checked = storage.initial;
    document.getElementById('accuracy_num').value = storage.accuracy;

    const status = new StatusApp({
        url: storage.tiles_url || '',
        coords: [storage.longitude || 0, storage.latitude || 0],
        onupdate: position => {
            browser.storage.local.get().then(storage => {
                const coords = positionToCoords(position);
                storage.longitude = coords[0];
                storage.latitude = coords[1];
                browser.storage.local.set(storage).then(() => {
                    setPosition(position);
                });
            });
        },
    });


    setTimeout(() => {
        status.resizeMap();
    }, 1000);



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

    if (!storage.tiles_url) {
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


    document.getElementById('enabled').addEventListener('change', () => {
        setStatus(document.getElementById('enabled').checked);
    });
});
