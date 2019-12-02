
Tests["physical-devices"] = function (ctx) {
    var repo = Modules.include("provisioning/physical-devices");

    var result = [];

    var physicalDevices = Modules.loadJson("lib/tests/resources/physical-devices-raw.json");
    var expected = Modules.loadJson("lib/tests/resources/physical-devices-expected.json");

    for (var id in physicalDevices) {
        if( physicalDevices.hasOwnProperty(id) && !isNaN(id) ) {
            var device = repo.getDevice(id, physicalDevices);
            if (device) {
                result.push(device)
            }
        }
    }

    if(!TestHelper.equal(result, expected)){
        return "unexpected result"
    }

    return null
};
