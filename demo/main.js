const BugBattle = window.BugBattle.default;

// Sample for feedback type options
BugBattle.setFeedbackTypeOptions([
  {
    title: "Support",
    description: "Get in touch with us. We are here to help.",
    icon: "https://jssdk.bugbattle.io/res/support.svg",
    action: () => {
      alert("Open Intercom for example.");
    },
  },
  {
    title: "Report an issue",
    description: "Something is broken? Let us know!",
    icon: "https://jssdk.bugbattle.io/res/bug.svg",
    action: () => {
      BugBattle.startBugReporting();
    },
  },
]);

BugBattle.setAppBuildNumber("2345");

BugBattle.enableReplays(true);

BugBattle.enablePoweredByBugbattle(true);

BugBattle.enableNetworkLogger();

BugBattle.enableCrashDetector(false, true);

// Sets the app's build number.
BugBattle.setAppBuildNumber(5);

// Sets the app's version code.
BugBattle.setAppVersionCode("v5.0");

// Attaches custom data to the bug reports.
BugBattle.attachCustomData({
  test1: "Battle",
  data2: "Unicorn",
});

// Disable shortcuts
BugBattle.enableShortcuts(true);

// Turn the privacy policy check on or off.
BugBattle.enablePrivacyPolicy(true);
BugBattle.setPrivacyPolicyUrl("htpp...");

// Sets weather to enable or disable the user screenshot step within the bug reporting flow.
BugBattle.disableUserScreenshot(false);

const feedbackButton = document.querySelector("#feedback-button");
if (feedbackButton) {
  feedbackButton.onclick = function () {
    BugBattle.xxx();
  };
}

console.warn("DEMO!");
console.log("HI!");

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    document.getElementById("demo").innerHTML = this.responseText;
  }
};
xhttp.open("GET", "https://run.mocky.io/v3/274ec30c-eeba-4248-b605-ace31b7e3b52", true);
xhttp.send();

BugBattle.initialize(
  "J4ADFNfzzCdYWr8NBO4rozcb6NFeyyES",
  BugBattle.FEEDBACK_BUTTON
);
