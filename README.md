# Geospoof

Geospoof will create a new panel in you Development tools that will allow you to control the location provided by Geolocation API.

You can set the location by map, coordinates or reproduce a GPX track.

**You will need to provide a OSM tiles URL to be able to use the extension**, e.g:
```
https://{a-c}.yourser.ver/x/y/x/?key
```

## Installation
This webextension uses the very convinient tool [webextension-toolbox](https://github.com/webextension-toolbox/webextension-toolbox).
```
git clone https://github.com/jorrete/geospoof.git
cd geospoof
npm install
```

## Development
```
npm run dev [firefox|chrome] 
```

## Build
```
npm run build [firefox|chrome] 
```
