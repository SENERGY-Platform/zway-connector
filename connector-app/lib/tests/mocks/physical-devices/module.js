Modules.registerModule("tests/mocks/physical-devices", function (module) {

    var PhysicalDevices = {
        devices: [],

        getDevices: function () {
            return PhysicalDevices.devices
        },

        mockSetDevices: function (devices) {
            PhysicalDevices.devices = devices
        }
    };

    return PhysicalDevices
});
