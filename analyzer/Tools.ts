export { };

function isBigEndian() {
    // check if the host uses big or small endian
    var b = new ArrayBuffer(4);
    var a = new Uint32Array(b);
    var c = new Uint8Array(b);
    a[0] = 0xdeadbeef;
    if (c[0] == 0xef) return true;
    return false;
}

exports.from2BytesToNumber = function from2BytesToNumber(bytes: Uint8Array) {
    if (isBigEndian()) {
        return ((bytes[0] << 8) | bytes[1]);
    } else {
        return ((bytes[1] << 8) | bytes[0]);
    }
}

exports.from4BytesToNumber = function from4BytesToNumber(bytes: Uint8Array) {
    if (isBigEndian()) {
        return ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]);
    } else {
        return ((bytes[3] << 24) | (bytes[2] << 16) | (bytes[1] << 8) | bytes[0]);
    }
}