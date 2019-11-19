import {StatusApp} from '../../app/modules/status';
import ua from '../modules/ua.js';

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

// register context
let port = browser.runtime.connect({
    name: `devtools_${browser.devtools.inspectedWindow.tabId}`
});

document.getElementById('enabled').addEventListener('change', () => {
    port.postMessage({
        status: document.getElementById('enabled').checked,
    });
});

browser.storage.local.get().then(storage => {
    document.getElementById('enabled').checked = storage.initial || false;

    const status = new StatusApp({
        url: storage.tiles_url || '',
        coords: [storage.longitude || 0, storage.latitude || 0],
        onupdate: position => {
            console.log('position', position, document.getElementById('enabled').checked);
            port.postMessage({
                position: position,
                status: document.getElementById('enabled').checked,
            });
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
        port.postMessage({
            status: true,
        });
    }

    port.onMessage.addListener(() => {
        document.getElementById('status').click();
    });
});
