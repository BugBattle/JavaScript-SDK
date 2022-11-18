const Gleap = window.Gleap;

Gleap.setFrameUrl("http://0.0.0.0:3001");
Gleap.setApiUrl("http://0.0.0.0:9000");
Gleap.initialize("ek98ANmHary9PQNG5EIl6TQd3SzqstZA");
//Gleap.setEnvironment("dev");

Gleap.attachCustomData({
  mission: "Unicorn",
  type: "Demo App",
  nestedData: {
    possible: true,
    name: "Mission: Impossible - Ghost Protocol",
  },
});

Gleap.identify("123456789", {
  name: "John Doe",
});

Gleap.log("Test log");
Gleap.log("Test log info", "INFO");
Gleap.log("Test log warn", "WARNING");
Gleap.log("Test log err", "ERROR");

Gleap.trackEvent("Master Event");

// Register custom action.
Gleap.registerCustomAction((customAction) => {
  console.log("Custom action called:");
  console.log(customAction);
});

// Network logs test.
setTimeout(() => {
  console.log("Loading place infos");

  var xmlhttp = new XMLHttpRequest();
  var url = "https://jsonplaceholder.typicode.com/todos/1";
  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var myArr = JSON.parse(this.responseText);
      console.log(myArr);
    }
  };
  xmlhttp.open("GET", url, true);
  xmlhttp.setRequestHeader("asdfasdf1", "wertwertwert1");
  xmlhttp.setRequestHeader("asdfasdf2", "wertwertwert2");
  xmlhttp.send();
}, 1000);
