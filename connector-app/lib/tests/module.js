var Tests = {};
var SKIP = "___skip";

var TestHelper = {
   "equal":
       function jsonequals(x, y) {
           // If both x and y are null or undefined and exactly the same
           if ( x === y ) {
               return true;
           }

           // If they are not strictly equal, they both need to be Objects
           if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) {
               return false;
           }

           // They must have the exact same prototype chain, the closest we can do is
           // test the constructor.
           if ( x.constructor !== y.constructor ) {
               return false;
           }

           for ( var p in x ) {
               // Inherited properties were tested using x.constructor === y.constructor
               if ( x.hasOwnProperty( p ) ) {
                   // Allows comparing x[ p ] and y[ p ] when set to undefined
                   if ( ! y.hasOwnProperty( p ) ) {
                       return false;
                   }

                   // If they have the same strict value or identity then they are equal
                   if ( x[ p ] === y[ p ] ) {
                       continue;
                   }

                   // Numbers, Strings, Functions, Booleans must be strictly equal
                   if ( typeof( x[ p ] ) !== "object" ) {
                       return false;
                   }

                   // Objects and Arrays must be tested recursively
                   if ( !TestHelper.equal( x[ p ],  y[ p ] ) ) {
                       return false;
                   }
               }
           }

           for ( p in y ) {
               // allows x[ p ] to be set to undefined
               if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) {
                   return false;
               }
           }
           return true;
       }
};

Modules.registerModule("tests", function (module) {
    module.add("device-mapping");
    module.add("connector");
    module.add("physical-devices");
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
                        console.log("\x1b[31mTEST EXCEPTION for "+testName+"\x1b[0m", e.stack);
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
