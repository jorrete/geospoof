import * as values from '../modules/values.js';
import {init} from '../modules/geolocation.js';
import {getOptions} from '../modules/storage.js';

const isTab = (
    browser.devtools.inspectedWindow.tabId !== undefined
    && browser.devtools.inspectedWindow.tabId !== null
    && location.protocol.startsWith('http')
);
console.log('xxxxxxxxxxxxxxx');
const port = browser.runtime.connect({
    name: `devtoolspage${isTab? `_${browser.devtools.inspectedWindow.tabId}`: ''}`,
});

function inject() {
    getOptions().then(options => {
        browser.devtools.inspectedWindow.eval(`(${init})(${JSON.stringify(options)});`);
        port.postMessage({
            status: options.status,
        });

    });
}

// not working well in remote target
// if gets gelocation referecen before injection
// on tabs is ok because content_script is injected
// before but on remote is injected on panel visible
if (isTab) {
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

    browser.devtools.inspectedWindow.eval('navigator.geolocation.isFake').then(isFake => {
        // already patched
        if (isFake) {
            return;
        }
        browser.devtools.network.onNavigated.addListener(inject);
        inject();
    });
}
