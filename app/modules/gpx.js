// TODO catch errors
function parseAttrs(tag, parsers) {
    return [].reduce.call(tag.attributes, (p, a) => {
        if ('__all' in parsers) {
            parsers.__all(a, p);
        }

        if (a.name in parsers) {
            parsers[a.name](a, p);
        }

        return p;
    }, {});
}



function parseTag(tag, parsers) {
    let obj = {};

    if ('__self' in parsers){
        parsers.__self(tag, obj);
    }

    [].forEach.call(tag.children, (t, i) => {
        if ('__all' in parsers) {
            parsers.__all(t, obj, i);
        }

        if (t.nodeName in parsers) {
            parsers[t.nodeName](t, obj, i);
        }
    });

    return obj;
}


class NodeBase {
    constructor(dom, options) {
        this._dom = dom;
        this.options = options;
        this._data = {};
    }

    get(key) {
        return this._data[key];
    }
}

class Point extends NodeBase {
    constructor() {
        super(...[].slice.call(arguments));
        this._data = parseTag(this._dom, {
            '__self': (t, obj) => {
                obj.coordinates = parseAttrs(t, {
                    '__all': (a, obj) => {
                        let value = a.value.trim();
                        if (value) {
                            obj[a.name] = parseFloat(value);
                        }
                    }
                });
            },
            'ele': (t, obj) => {
                let ele = t.textContent.trim();
                if (ele) {
                    obj.ele = parseFloat(ele);
                }
            },
            'time': (t, obj) => {
                let time = t.textContent.trim();
                if (time) {
                    obj.time = new Date(Date.parse(time)).getTime();
                }
            },
        });
    }

    toGeometry() {
        let coords = [this._data.coordinates.lon, this._data.coordinates.lat];
        if (this._data.ele) {
            coords.push(this._data.ele);
        }
        return coords;
    }

    toGeojson() {
        let properties = Object.assign({}, this._data);
        delete properties.coordinates;
        return generatePoint({
            geometry: {
                coordinates: this.toGeometry(),
            },
            properties: properties,
        });
    }
}

// geojson
function getFeature(options) {
    return Object.assign(options, {
        'type': 'Feature',
    });
}

function generateFeatureCollection(options) {
    return {
        'type': 'FeatureCollection',
        'features': options.features,
    };
}


function generatePoint(options) {
    Object.assign(options.geometry, {type: 'Point'});
    return getFeature(options);
}


function generateLineString(options) {
    Object.assign(options.geometry, {type: 'LineString'});
    return getFeature(options);
}


function generateMultiLineString(options) {
    Object.assign(options.geometry, {type: 'MultiLineString'});
    return getFeature(options);
}

function decodeHtml(html) {
    let txt = document.createElement('textarea');
    txt.textContent = html;
    return txt.value;
}

class Metadata extends NodeBase {
    constructor() {
        super(...arguments);

        this._data = parseTag(this._dom, {
            'time': (t, obj) => {
                let time = t.textContent.trim();
                if (time) {
                    obj.time = new Date(Date.parse(time)).getTime();
                }
            },
            'bounds': (t, obj) => {
                obj.bounds = parseAttrs(t, {
                    '__all': (a, obj) => {
                        let value = a.value.trim();
                        if (value) {
                            obj[a.name] = parseFloat(value);
                        }
                    }
                });
            },
        });
    }
}

class Trkpt extends Point {
    toGeojson() {
        return Object.assign(super.toGeojson(), {
            gpx: {
                type: 'trkpt',
            },
        });
    }
}

class Trkseg extends NodeBase {
    constructor() {
        super(...[].slice.call(arguments));
        let trkpt = this._dom.querySelectorAll('trkseg > trkpt');
        this.trkpt = [].map.call(trkpt, t => new Trkpt(t));
    }

    toGeometry() {
        return this.trkpt.map(t => t.toGeometry());
    }

    toGeojson() {
        let result = {
            geometry: {
                coordinates: [],
            },
            properties: this._data,
            gpx: {
                type: 'trkseg',
                trkpt: [],
            },
        };

        this.trkpt.forEach(t => {
            result.geometry.coordinates.push(t.toGeometry());
            result.gpx.trkpt.push(t.toGeojson());
        });

        return generateLineString(result);
    }
}

class Trk extends NodeBase {
    constructor() {
        super(...[].slice.call(arguments));
        this._data = parseTag(this._dom, {
            'name': (t, obj) => {
                let name = decodeHtml(t.textContent.replace('<![CDATA[', '').replace(']]>', '').trim());
                if (name) {
                    obj.name = name;
                }
            },
        });

        this._parseTrkseg();
    }

    _parseTrkseg() {
        let trkseg = this._dom.querySelectorAll('trk > trkseg');
        this.trkseg = [].map.call(trkseg, trkseg => new Trkseg(trkseg));
    }

    toGeojson() {
        let result = {
            geometry: {
                coordinates: [],
            },
            properties: this._data,
            gpx: {
                type: 'trk',
                trkseg: [],
            },
        };

        this.trkseg.forEach(t => {
            result.geometry.coordinates.push(t.toGeometry());
            result.gpx.trkseg.push(t.toGeojson());
        });

        return generateMultiLineString(result);
    }
}

class Rtept extends Point {
    toGeojson() {
        return Object.assign(super.toGeojson(), {
            gpx: {
                type: 'rtept',
            },
        });
    }
}

class Rte extends NodeBase {
    constructor() {
        super(...[].slice.call(arguments));
        this._data = parseTag(this._dom, {
            'name': (t, obj) => {
                let name = decodeHtml(t.textContent.replace('<![CDATA[', '').replace(']]>', '').trim());
                if (name) {
                    obj.name = name;
                }
            },
        });

        this._parseRtept();
    }

    _parseRtept() {
        let rtept = this._dom.querySelectorAll('rte > rtept');
        this.rtept = [].map.call(rtept, rtept => new Rtept(rtept, this.options));
    }

    toGeojson() {
        let result = {
            geometry: {
                coordinates: [],
            },
            properties: this._data,
            gpx: {
                type: 'rte',
                rtept: [],
            },
        };

        this.rtept.forEach(t => {
            result.geometry.coordinates.push(t.toGeometry());
            result.gpx.rtept.push(t.toGeojson());
        });

        return generateLineString(result);
    }
}

export class Gpx {
    constructor(options) {
        this.options = Object.assign({
        }, (options || {}));
        // console.log(...msg(this, 'options', this.options));
    }

    read(text) {
        try {
            this._dom = new DOMParser().parseFromString(text, 'text/xml');
            // console.log(...msg(this, 'read', this._dom));
            this._parseMetadata();
            this._parseTrk();
            this._parseRte();
        } catch (e) {
            // console.error(...msg(this, 'read', this._dom));
            return Promise.reject('parsing');
        }
        return Promise.resolve(this);
    }

    // helpers
    _parseMetadata() {
        let metadata = this._dom.querySelectorAll('gpx > metadata');

        if (!metadata.length) {
            // console.warn(...msg(this, `found ${metadata.length} metadata tags`));
            return;
        }

        this.metadata = new Metadata(metadata[0]);

    }

    _parseTrk() {
        let trk = this._dom.querySelectorAll('gpx > trk');
        this.trk = [].map.call(trk, trk => new Trk(trk, this.options));
    }

    _parseRte() {
        let rte = this._dom.querySelectorAll('gpx > rte');
        this.rte = [].map.call(rte, rte => new Rte(rte, this.options));
    }

    toGeojson() {
        return generateFeatureCollection({
            features: [].concat(
                this.trk.map(t => t.toGeojson()),
                this.rte.map(t => t.toGeojson())
            )
        });
    }
}
