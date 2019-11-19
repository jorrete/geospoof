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
const pages = new Map();
const devtools = new Map();
const ports = new Map();

let position, status;

browser.runtime.onConnect.addListener(port => {
    const name = port.name;
    let tabId;

    console.log('[onConnect]', port);

    if (name.startsWith('devtools')) {
        tabId = parseInt(name.split('_')[1]);
            
        devtools.set(tabId, port);

        port.onDisconnect.addListener(() => {
            if (!pages.has(tabId)) {
                return;
            }

            try {
                pageIconStatus(false, tabId);
                pages.get(tabId).postMessage({
                    status: false,
                });
            } catch (e) {
                void 0;
            }
        });

        port.onMessage.addListener(message => {
            if (message.settings) {
                browser.runtime.openOptionsPage()
                return;
            }


            if (!pages.has(tabId)) {
                return;
            }

            position = message.position;
            status = message.status;

            pages.get(tabId).postMessage({
                position: position,
                status: status,
            });

            pageIconStatus(status, tabId);
        });
    }
    else if (name.startsWith('content_script')) {
        tabId = port.sender.tab.id;
        pages.set(tabId, port);
    }

    ports.set(tabId, port);
});

browser.tabs.onRemoved.addListener(id => {
    pages.delete(id);
    devtools.delete(id);
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

    const port = ports.get(event.id);

    if (!port) {
        return;
    }

    port.postMessage({
        click: true,
    });
});
