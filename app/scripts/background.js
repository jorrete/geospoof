function pageIconStatus(status, tabId) {
    console.log('[pageIconStatus]', status, tabId);

    browser.pageAction.show(tabId);

    if (status) {
        browser.pageAction.setIcon({
            tabId: tabId,
            path: 'images/icon-48.png'
        });
    } else {
        browser.pageAction.setIcon({
            tabId: tabId,
            path: 'images/icon_gray-48.png'
        });
    }
}

// register contexts
const tabs = new Map();
const remotes = new Map();

browser.runtime.onConnect.addListener(port => {
    port.isTab = port.sender.frameId === undefined;
    port.isRemote = port.sender.frameId !== undefined;

    if (port.isTab) {
        port.sender.tabId = parseInt(port.name.split('_')[1]);
        tabs.set(port.sender.tabId, port);
    } else {
        remotes.set(port.sender.frameId, port);
    }

    port.onDisconnect.addListener(() => {
        try {
            if (port.isTab) {
                pageIconStatus(false, port.sender.tabId);
            }
        } catch (e) {
            void 0;
        }
    });

    port.onMessage.addListener(message => {
        if (message.settings) {
            browser.runtime.openOptionsPage()
            return;
        }

        if (port.isTab && message.status !== undefined) {
            pageIconStatus(message.status, port.sender.tabId);
        }
    });

    console.log('[onConnect]', port, port.sender);
});

browser.tabs.onRemoved.addListener(id => {
    if (tabs.has(id)) {
        tabs.delete(id);
    }
});


// activate already opened pages
browser.tabs.query({}).then((tabs) => {
    for (let tab of tabs) {
        pageIconStatus(false, tab.id);
    }
});

// on navigate reset
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    pageIconStatus(false, tab.id);
});


browser.pageAction.onClicked.addListener(event => {
    console.log('[background][pageAction][click]', event);

    const port = tabs.get(event.id);

    if (!port) {
        return;
    }

    port.postMessage({
        click: true,
    });
});
