import {getStorage} from '../modules/storage.js';

// register contexts
const content = new Map();
const dev_page = new Map();
const dev_panel = new Map();
const remote = new Map();

function pageIconStatus(id, status) {
    console.log('[pageIconStatus]', id, status, content);

    if (!content.has(id)) {
        return;
    }

    browser.pageAction.show(id);

    if (status) {
        browser.pageAction.setIcon({
            tabId: id,
            path: 'images/icon-48.png'
        });
    } else {
        browser.pageAction.setIcon({
            tabId: id,
            path: 'images/icon_gray-48.png'
        });
    }
}

browser.runtime.onConnect.addListener(port => {
    if (port.sender.tab && port.sender.tab.id !== -1) {
        port.isTab = true;
        port.isDevtoolsPage = false;
        port.isDevtoolsPanel = false;
        port.isRemote = false;
        port.sender.tabId = port.sender.tab.id;
        content.set(port.sender.tabId, port);

        getStorage().then(storage => {
            pageIconStatus(port.sender.tabId, storage.initial);
        });
    }

    else if (port.sender.url.endsWith('devtools_page.html')) {
        port.isTab = false;
        port.isDevtoolsPage = true;
        port.isDevtoolsPanel = false;
        port.isRemote = false;
        port.sender.tabId = parseInt(port.name.split('_')[1]);
        dev_page.set(port.sender.tabId, port);
    }

    else if (port.sender.url.endsWith('devtools_panel.html')) {
        port.isTab = false;
        port.isDevtoolsPage = false;
        port.isDevtoolsPanel = true;
        port.isRemote = false;
        port.sender.tabId = parseInt(port.name.split('_')[1]);
        dev_panel.set(port.sender.tabId, port);
    }

    else if (port.sender.frameId !== undefined) {
        port.isTab = false;
        port.DevtoolsPage = false;
        port.DevtoolsPanel = false;
        port.isRemote = true;
        port.sender.tabId = parseInt(port.name.split('_')[1]);
        remote.set(port.sender.frameId, port);
    }

    port.onMessage.addListener(message => {
        if (message.settings) {
            browser.runtime.openOptionsPage()
            return;
        }

        if (port.isDevtoolsPanel && message.status !== undefined) {
            pageIconStatus(port.sender.tabId, message.status);
        }
    });

    console.log('[onConnect]', port, port.sender);
});

browser.tabs.onRemoved.addListener(id => {
    if (content.has(id)) {
        content.delete(id);
    }

    if (dev_page.has(id)) {
        dev_page.delete(id);
    }

    if (dev_panel.has(id)) {
        dev_panel.delete(id);
    }
});


// activate already opened pages
browser.tabs.query({}).then((tabs) => {
    getStorage().then(storage => {
        for (let tab of tabs) {
            pageIconStatus(tab.id, storage.initial);
        }
    });
});
