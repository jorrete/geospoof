import {init} from '../modules/geolocation.js';
import {getOptions} from '../modules/storage.js';

browser.runtime.connect({
    name: 'content_script'
});

getOptions().then(options => {
    let tag = document.createElement('script');
    tag.setAttribute('charset', 'utf-8');
    tag.setAttribute('async', 'false');
    tag.textContent = `(${init})(${JSON.stringify(options)});`;
    document.documentElement.appendChild(tag);
    document.documentElement.removeChild(tag);
});
