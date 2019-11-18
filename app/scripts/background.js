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
