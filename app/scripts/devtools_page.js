import * as values from '../modules/values.js';
import {inject} from '../modules/geolocation.js';

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
    if (isFake) {
        return;
    }
    browser.devtools.network.onNavigated.addListener(inject);
    inject();
});
