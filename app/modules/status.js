import {initMap} from '../modules/map.js';
import {lonToDMS, latToDMS, toDD} from '../modules/helpers.js';
import {buildPosition, fileToGeojson, serializeForm} from '../modules/helpers.js';
import along from '../../node_modules/@turf/along';
import length from '../../node_modules/@turf/length';
import lineSlice from '../../node_modules/@turf/line-slice';
import pointToLineDistance from '../../node_modules/@turf/point-to-line-distance';
import {point} from '../../node_modules/@turf/helpers';

const INTERVAL = 500;

// TODO remove coords setter to a private method
export class StatusApp {
    constructor(options={}) {
        this.options = Object.assign({
            coords: [0, 0],
            onupdate: options.onupdate || console.log,
        }, options);

        this.field = {
            accuracy: document.getElementById('accuracy_num'),
            lon: document.getElementById('lon'),
            lon_deg: document.getElementById('lon_deg'),
            lon_min: document.getElementById('lon_min'),
            lon_sec: document.getElementById('lon_sec'),
            lon_orientation: document.getElementById('lon_orientation'),
            lat: document.getElementById('lat'),
            lat_deg: document.getElementById('lat_deg'),
            lat_min: document.getElementById('lat_min'),
            lat_sec: document.getElementById('lat_sec'),
            lat_orientation: document.getElementById('lat_orientation'),
            track: document.getElementById('track'),
            track_form: document.getElementById('track_form'),
            track_controls: document.getElementById('track_controls'),
            track_name: document.getElementById('track_name'),
            track_play: document.getElementById('track_play'),
            track_reset: document.getElementById('track_reset'),
            accuracy_num: document.getElementById('accuracy_num'),
        };

        this.field.track.addEventListener('change', () => {
            const file = event.target.files[0];
            fileToGeojson(file).then(track => this.loadTrack(track, track.properties.name || file.name));
        });

        this.field.accuracy_num.addEventListener('change', () => {
            this._setCoords();
        });

        this.field.track_form.addEventListener('reset', () => {
            this.stopTrack();
        });

        this.field.track_form.addEventListener('change', event => {
            switch (event.target.name) {
                case 'direction':
                    this.changeDirection(event.target.value);
            }
        });

        this.field.track_play.addEventListener('input', () => {
            if (this.isTrackPlaying()) {
                this.playTrack();
            } else {
                this.pauseTrack();
            }
        });

        [
            'lon',
            'lat',
        ].forEach(id => {
            this.field[id].addEventListener('change', () => {
                this.pauseTrack();
                this._setCoords([this.field.lon.value, this.field.lat.value]);
            })
        });

        [
            'lon_deg',
            'lon_min',
            'lon_sec',
            'lon_orientation',
            'lat_deg',
            'lat_min',
            'lat_sec',
            'lat_orientation',
        ].forEach(id => {
            this.field[id].addEventListener('change', () => {
                this.pauseTrack();
                const lon = toDD(
                    this.field.lon_deg.value,
                    this.field.lon_min.value,
                    this.field.lon_sec.value,
                    this.field.lon_orientation.value);
                const lat = toDD(
                    this.field.lat_deg.value,
                    this.field.lat_min.value,
                    this.field.lat_sec.value,
                    this.field.lat_orientation.value);
                this._setCoords([lon, lat]);
            });
        });


        this.map = initMap({
            url: options.url,
            initialCoordinates: options.coords,
            onchange: coords => {
                this._setCoords(coords);
                var pt = point(coords);
                if (!this._track) {
                    return;
                }
                const distance = pointToLineDistance(pt, this._track, {units: 'meters'});
                const onTrack = distance < 0.01;
                if (!onTrack) {
                    return;
                }
                const initPt = point(this._track.geometry.coordinates[0]);
                const sliced = lineSlice(initPt, pt, this._track);
                this._distance = length(sliced, {units: 'meters'});
                this.playTrack();
            },
            ongrab: () => {
                this.pauseTrack();
            },
        });

        this._setCoords(options.coords);
    }

    resizeMap() {
        this.map.resize();
    }

    changeDirection(direction) {
        this._track.geometry.coordinates = this._track.geometry.coordinates.reverse();

        this.map.loadTrack(this._track);

        if (this._distance !== undefined) {
            if (direction === 'reverse') {
                this._distance = Math.abs(this._distance - this._length);
            } else {
                this._distance = this._length - this._distance;
            }
        }
    }

    loadTrack(track, name) {
        this._track = track;
        this._length = length(this._track, {units: 'meters'});

        this.map.loadTrack(this._track);

        if (!this.field.track_name._initial) {
            this.field.track_name._initial = this.field.track_name.textContent;
        }

        this.field.track_name.textContent = name;

        this.playTrack();
    }

    isTrackPlaying() {
        return this.field.track_play.checked;
    }

    playTrack() {
        this.field.track_play.checked = true;
        this.field.track_controls.classList.remove('disabled');
        this.field.track_reset.classList.remove('disabled');
        this._trackInterval = setInterval(() => {
            const {mode, speed} = serializeForm(this.field.track_form);

            this._distance = (function () {
                if (this._distance === undefined) {
                    return 0;
                }

                const speedMMS = parseInt(speed) * 1000 / 3600000;
                const distanceDelta = speedMMS * INTERVAL;
                let distance = this._distance + distanceDelta;

                switch (mode) {
                    case 'oneway':
                        distance = distance > this._length? this._length: distance;
                        break;
                    case 'loop':
                        distance = distance > this._length? 0: distance;
                        break;
                }

                return distance;
            }.bind(this)());

            // check if has been paused during interval
            if (!this.isTrackPlaying()) {
                return;
            }

            const pt = along(this._track, this._distance, {units: 'meters'});
            this._setCoords(pt.geometry.coordinates);

        }, INTERVAL);
    }

    pauseTrack() {
        this.field.track_play.checked = false;
        clearInterval(this._trackInterval);
    }

    stopTrack() {
        this.pauseTrack();
        this.field.track_controls.classList.add('disabled');
        this.field.track_reset.classList.add('disabled');
        delete this._track;
        delete this._distance;
        this.map.clearTrack();
        this.field.track_name.textContent = this.field.track_name._initial;
    }

    _setCoords(coords) {
        coords = (coords === undefined && this._coords !== undefined)? this._coords: coords;
        coords = coords.map(c => parseFloat(parseFloat(c).toFixed(6)));
        this._coords = [
            (Math.abs(coords[0]) > 180? 180: Math.abs(coords[0])) * (coords[0] >= 0? 1: -1),
            (Math.abs(coords[1]) > 90? 90: Math.abs(coords[1])) * (coords[1] >= 0? 1: -1),
        ];
        this._position = buildPosition(this._coords, this.accuracy);
        this._updateFields();
        this.map.updatePosition(this.position);
        this.options.onupdate(this.position);
    }

    _updateFields() {
        let lon = lonToDMS(this.longitude);
        this.field.lon.value = this.longitude;
        this.field.lon_deg.value = lon[0];
        this.field.lon_min.value = lon[1];
        this.field.lon_sec.value = lon[2];
        this.field.lon_orientation.value = lon[3];

        let lat = latToDMS(this.latitude);
        this.field.lat.value = this.latitude;
        this.field.lat_deg.value = lat[0];
        this.field.lat_min.value = lat[1];
        this.field.lat_sec.value = lat[2];
        this.field.lat_orientation.value = lat[3];
    }

    get coords() {
        return this._coords;
    }

    get position () {
        return this._position;
    }

    get longitude () {
        return this._coords[0];
    }

    get latitude () {
        return this._coords[1];
    }

    get accuracy () {
        return parseInt(this.field.accuracy.value);
    }

    get track() {
        return this._track;
    }
}
