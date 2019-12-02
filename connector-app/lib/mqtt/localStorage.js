
var localStorageMap = {};

var localStorage = {
    getMap: function () {
        return localStorageMap
    },
    setItem: function (key, value) {
        localStorageMap[key] = value;
    },
    getItem: function (key) {
        return localStorageMap[key]
    },
    removeItem: function (key) {
        delete localStorageMap[key]
    }
};
