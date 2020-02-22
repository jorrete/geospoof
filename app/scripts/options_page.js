const tiles_url = document.getElementById('tiles_url');
const initial = document.getElementById('initial');
const longitude = document.getElementById('longitude');
const latitude = document.getElementById('latitude');
const accuracy = document.getElementById('accuracy');
const altitude = document.getElementById('altitude');

browser.storage.local.get().then(storage => {
    tiles_url.value = storage.tiles_url;
    initial.checked = storage.initial;
    longitude.value = storage.longitude;
    latitude.value = storage.latitude;
    accuracy.value = storage.accuracy;
    altitude.value = storage.altitude;
});

browser.storage.onChanged.addListener(storage => {
    Object.keys(storage).forEach(key => {
        if (storage[key].newValue) {
            document.getElementById(key).value = storage[key].newValue;
        }
    });
});

document.getElementById('save').addEventListener('click', () => {
    browser.storage.local.set({
        tiles_url: tiles_url.value.trim(),
        initial: initial.checked,
        longitude: parseFloat(longitude.value),
        latitude: parseFloat(latitude.value),
        accuracy: parseFloat(accuracy.value),
        altitude: parseFloat(altitude.value),
    });
})
