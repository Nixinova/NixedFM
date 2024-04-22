
const DB = '../database/';
window.scrobbles = [];
window.database = {};
window.timesScrobbled = {
    artists: {},
    albums: {},
    tracks: {},
}

function parseCsvLine(line) {
    let quoted = false;
    const data = [];
    let cur = '';
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (quoted) {
                data.push(cur);
                cur = '';
            }
            quoted = !quoted;
            continue;
        }
        if (quoted) {
            // add text to cur while quoted
            cur += char;
        }
    }
    return data;
}

function createCanonical(artist, item) {
    const normalise = text => text.toLowerCase().replace(/ /g, '_').replace(/\W/g, '').replace(/_+/g, '_')
    if (!item) return normalise(artist);
    return normalise(artist + ' - ' + item);
}

async function loadDatabaseItems() {
    const database = await fetch(DB + 'database.json').then(data => data.json());
    window.database = database;
}

async function loadScrobbles() {
    const scrobblesCSV = await fetch(DB + 'scrobbles.csv').then(data => data.text());
    const [csvHeader, ...csvLines] = scrobblesCSV.split(/\r?\n/);
    const csvHeaders = csvHeader.split(',');
    csvLines.slice(1).map(line => {
        if (!line) return;
        const parts = parseCsvLine(line);
        // Loop through data and assign headings
        const data = {};
        for (let i = 0; i < parts.length; i++) {
            const heading = csvHeaders[i];
            data[heading] = parts[i];
        }
        // Set canon track/album
        data.canonArtist = createCanonical(data.artist);
        data.canonAlbum = createCanonical(data.artist, data.album);
        data.canonTrack = createCanonical(data.artist, data.track);
        // Add to list
        scrobbles.push(data);
        // Set times scrobbled
        window.timesScrobbled.artists[data.canonArtist] ??= 0;
        window.timesScrobbled.artists[data.canonArtist]++;
        window.timesScrobbled.albums[data.canonAlbum] ??= 0;
        window.timesScrobbled.albums[data.canonAlbum]++;
        window.timesScrobbled.tracks[data.canonTrack] ??= 0;
        window.timesScrobbled.tracks[data.canonTrack]++;
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    await loadScrobbles();
    await loadDatabaseItems();
    for (const func of window.funcs) {
        func();
    }
});
