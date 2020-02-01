import * as values from '../modules/values.js';
import {init} from '../modules/geolocation.js';
import {getOptions} from '../modules/storage.js';

const isTab = browser.devtools.inspectedWindow.tabId !== undefined;
const port = browser.runtime.connect({
    name: `devtoolspage${isTab? `_${browser.devtools.inspectedWindow.tabId}`: ''}`,
});

// create panel
browser.devtools.panels.create(
    values.DEV_PANEL_NAME,
    '/images/icon-48.png',
    '/pages/devtools_panel.html').then((newPanel) => {
        newPanel.onShown.addListener(() => {
            console.log('[devtools_panel][show]');
        });
        newPanel.onHidden.addListener(() => {
            console.log('[devtools_panel][hide]');
        });
    });


function inject() {
    getOptions().then(options => {
        console.log('inject');
        browser.devtools.inspectedWindow.eval(`(${init})(${JSON.stringify(options)});`);
        port.postMessage({
            status: options.status,
        });

    });
}

browser.devtools.inspectedWindow.eval('navigator.geolocation.isFake').then(isFake => {
    // already patched
    if (isFake) {
        return;
    }
    browser.devtools.network.onNavigated.addListener(inject);
    inject();
});
