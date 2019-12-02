var Tests = {};
var SKIP = "___skip";

Modules.registerModule("tests", function (module) {
    module.add("device-mapping");
    module.add("connector");
    return {
        run: function (controller, config) {
            var ctx = {controller: controller, config: config};
            var failed = [];
            var ok = [];
            for(testName in Tests){
                if (Tests.hasOwnProperty(testName)){
                    try{
                        var testResult = Tests[testName](ctx);
                        if(testResult === SKIP){
                            ok.push({name: "SKIP "+testName})
                        }else if(testResult){
                            failed.push({name: "\x1b[31m"+testName+"\x1b[0m", message: testResult})
                        }else{
                            ok.push({name: "\x1b[36m"+testName+"\x1b[0m"})
                        }
                    }catch (e) {
                        failed.push({name: "\x1b[31m"+testName+"\x1b[0m", message: "exception: "+e.message})
                    }
                }
            }
            console.log("================================");
            console.log("|        TEST-RESULTS          |");
            console.log("================================");
            for(var i=0; i<failed.length; i++){
                console.log(failed[i].name, "|", failed[i].message);
            }
            for(var i=0; i<ok.length; i++){
                console.log(ok[i].name);
            }
            console.log("================================");
        }
    };
});
