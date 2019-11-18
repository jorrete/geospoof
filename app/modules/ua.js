export default (function () {
    // Opera 8.0+ (tested on Opera 42.0)
    let isOpera = (!!window.opr && !!opr.addons) || !!window.opera 
        || navigator.userAgent.indexOf(' OPR/') >= 0;

    if (isOpera) {
        return 'opera';
    }

    // Firefox 1.0+ (tested on Firefox 45 - 53)
    let isFirefox = typeof InstallTrigger !== 'undefined';

    if (isFirefox) {
        return 'firefox';
    }

    // Internet Explorer 6-11
    //   Untested on IE (of course). Here because it shows some logic for isEdge.
    let isIE = /*@cc_on!@*/false || !!document.documentMode;

    if (isIE) {
        return 'ie';
    }

    // Edge 20+ (tested on Edge 38.14393.0.0)
    let isEdge = !isIE && !!window.StyleMedia;

    if (isEdge) {
        return 'edge';
    }

    // Chrome 1+ (tested on Chrome 55.0.2883.87)
    // This does not work in an extension:
    //let isChrome = !!window.chrome && !!window.chrome.webstore;
    // The other browsers are trying to be more like Chrome, so picking
    // capabilities which are in Chrome, but not in others is a moving
    // target.  Just default to Chrome if none of the others is detected.
    let isChrome = !isOpera && !isFirefox && !isIE && !isEdge;

    if (isChrome) {
        return 'chrome';
    }
}());
