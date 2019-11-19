// register contexts
const pages = new Map();
const devtools = new Map();

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
        });
    }
    else if (name.startsWith('content_script')) {
        tabId = port.sender.tab.id;
        pages.set(tabId, port);

        port.onMessage.addListener(message => {

            if (!pages.has(tabId) || !message.ping) {
                return;
            }

            pages.get(tabId).postMessage({
                position: position,
                status: status,
            });
        });
    }
});

browser.tabs.onRemoved.addListener(id => {
    pages.delete(id);
    devtools.delete(id);
});

// ---------------------------

function statusPageIcon(status, tabId) {
    if (status) {
        console.log('show');
        browser.pageAction.show(tabId);
        browser.pageAction.setIcon({
            tabId: tabId,
            path: 'images/icon-48.png'
        });
    } else {
        console.log('hide');
        browser.pageAction.hide(tabId);
        browser.pageAction.setIcon({
            tabId: tabId,
            path: 'images/icon_gray-48.png'
        });
    }
}

// activate already opened pages
browser.tabs.query({}).then((tabs) => {
    for (let tab of tabs) {
        // statusPageIcon(false, tab.id);
        statusPageIcon(true, tab.id);
    }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(tab, tab.id);
    // statusPage(true, tab.id);
});

browser.pageAction.onClicked.addListener(event => {
    console.log('[background][pageAction][click]', event);
});
