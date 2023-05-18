function valNumAndLength(str) {
    return /^\d+$/.test(str) && str.length == 6 ? true : false;
}

module.exports = {
    valNumAndLength
}