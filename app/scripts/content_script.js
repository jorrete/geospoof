console.log('[content_script]');

function init() {
    let status, position;

    const getCurrentPosition = navigator.geolocation.getCurrentPosition,
          watchPosition = navigator.geolocation.watchPosition,
          clearWatch = navigator.geolocation.clearWatch;

    const geolocation_fake = new class {
        get fake () {
            return true;
        }

        constructor() {
            console.log('[geolocation][fake]', this);
        }

        getCurrentPosition(success, error) {
            if (!position) {
                return error();
            }

            success(position);
        }

        watchPosition(success, error) {
            if (!position) {
                return error();
            }

            return setInterval(() => {
                success(position);
            }, 2000);
        }

        clearWatch(id) {
            clearInterval(id);
        }
    };

    Object.assign(navigator.geolocation, {
        getCurrentPosition: function () {
            (status?
                geolocation_fake.getCurrentPosition.bind(geolocation_fake):
                getCurrentPosition.bind(navigator.geolocation)
            )(...arguments);
        },
        watchPosition: function () {
            return (status?
                geolocation_fake.watchPosition.bind(geolocation_fake):
                watchPosition.bind(navigator.geolocation)
            )(...arguments);
        },
        clearWatch: function () {
            (status?
                geolocation_fake.clearWatch.bind(geolocation_fake):
                clearWatch.bind(navigator.geolocation)
            )(...arguments);
        },
    })

    window.addEventListener('message', function (event) {
        status = event.data.status !== undefined? event.data.status: status;
        position = event.data.position !== undefined? event.data.position: position;
        console.log('[page][update]', status, position);
    });
}

if (document.documentElement.tagName.toLowerCase() == 'html') {  // Skip non-html pages.
    let tag = document.createElement('script');
    tag.setAttribute('charset', 'utf-8');
    tag.setAttribute('async', 'false');
    tag.textContent = `(${init})();`;
    document.documentElement.appendChild(tag);
    document.documentElement.removeChild(tag);
}


document.addEventListener('DOMContentLoaded', () => {
    // register context
    let port = browser.runtime.connect({
        name: 'content_script'
    });

    port.onMessage.addListener(message => {
        console.log('[content_script][update]', message);
        window.postMessage({
            status: message.status,
            position: message.position,
        }, '*');
    });

    port.postMessage({
        ping: true,
    });
});
