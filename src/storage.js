import zlib from 'browserify-zlib';

export function getItemGZIP(key) {
    let stringValue = localStorage.get(key);
    let ungzippedValue;

    if (stringValue) {
        ungzippedValue = zlib.ungzipSync(stringValue);
    }

    return ungzippedValue || stringValue;
}

export function setItemGZIP(key, value) {
    let gzippedValue = zlib.gzipSync(value);

    if (gzippedValue) {
        localStorage.setItem(key, gzippedValue);
    }
}
