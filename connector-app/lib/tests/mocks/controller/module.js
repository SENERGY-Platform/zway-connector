Modules.registerModule("tests/mocks/controller", function (module) {

    var controller = {
        devices: [],
        uuid: null,

        mockSetDevices: function (devices) {
            controller.devices = devices;
        },

        mockSetUUID: function (uuid) {
            controller.uuid = uuid;
        }
    };

    return controller
});
