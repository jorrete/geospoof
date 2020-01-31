const tiles_url = document.getElementById('tiles_url');
const initial = document.getElementById('initial');
const longitude = document.getElementById('longitude');
const latitude = document.getElementById('latitude');
const accuracy = document.getElementById('accuracy');

browser.storage.local.get().then(storage => {
    tiles_url.value = storage.tiles_url;
    initial.checked = storage.initial;
    longitude.value = storage.longitude;
    latitude.value = storage.latitude;
    accuracy.value = storage.accuracy;
});

document.getElementById('save').addEventListener('click', () => {
    browser.storage.local.set({
        tiles_url: tiles_url.value.trim(),
        initial: initial.checked,
        longitude: parseFloat(longitude.value),
        latitude: parseFloat(latitude.value),
        accuracy: parseFloat(accuracy.value),
    });
})
