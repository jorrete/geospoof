const tilesUrl = document.getElementById('tiles_url');
const initial = document.getElementById('initial');
const longitude = document.getElementById('longitude');
const latitude = document.getElementById('latitude');

browser.storage.local.get().then(storage => {
    tilesUrl.value = storage.tiles_url !== undefined? storage.tiles_url: '';
    initial.checked = storage.initial !== undefined? storage.initial: false;
    longitude.value = storage.longitude !== undefined? storage.longitude: '';
    latitude.value = storage.latitude !== undefined? storage.latitude: '';
});

document.getElementById('save').addEventListener('click', () => {
    browser.storage.local.set({
        'tiles_url': tilesUrl.value.trim(),
        'initial': initial.checked,
        'longitude': parseFloat(longitude.value) || 0,
        'latitude': parseFloat(latitude.value) || 0,
    });
})
