const TIMEOUT = 5000;

export function init(options={}) {
    let position = options.position,
        status = Boolean(options.status);


    const getCurrentPosition = navigator.geolocation.getCurrentPosition,
          watchPosition = navigator.geolocation.watchPosition,
          clearWatch = navigator.geolocation.clearWatch;


    const errors = {
        '1': 'PERMISSION_DENIED',
        '2': 'POSITION_UNAVAILABLE',
        '3': 'TIMEOUT',
    };

    class PositionError extends Error {
        constructor(options={}) {
            const code = options.code || 2;
            const message = options.message || errors[`${code}`];
            super(message);
            this.code = code;
            this.message = message;
        }
    }

    const geolocation_fake = new class {
        constructor() {
            console.log('[geolocation][fake]', this);
        }

        getCurrentPosition(success, error) {
            if (!position) {
                return error(new PositionError());
            }

            success(position);
        }

        watchPosition(success, error) {
            if (!position) {
                return error(new PositionError());
            }

            return setInterval(() => {
                success(position);
            }, TIMEOUT);
        }

        clearWatch(id) {
            clearInterval(id);
        }
    };

    Object.assign(navigator.geolocation, {
        getCurrentPosition: function () {
            return (status?
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
            geolocation_fake.clearWatch.bind(geolocation_fake)(...arguments);
            clearWatch.bind(navigator.geolocation)(...arguments);
        },
        setStatus: function (newStatus) {
            status = Boolean(newStatus);
        },
        setPosition: function (newPosition) {
            position = newPosition;
        },
        isFake: function () {
            return status;
        }
    })
    console.log('[Geospoof][init]', options, navigator.geolocation);
}
