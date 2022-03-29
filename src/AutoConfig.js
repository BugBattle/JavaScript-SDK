import Gleap from "./Gleap";
import { loadFromGleapCache, saveToGleapCache } from "./GleapHelper";
import Session from "./Session";

export default class AutoConfig {
  static run = () => {
    const session = Session.getInstance();
    const cachedConfig = loadFromGleapCache(`config-${session.sdkKey}`);
    if (cachedConfig) {
      AutoConfig.applyConfig(cachedConfig, false);
      AutoConfig.loadConfigFromServer(true).catch(function (e) {});
      return Promise.resolve();
    }

    return AutoConfig.loadConfigFromServer(false);
  };

  static loadConfigFromServer = (soft) => {
    return new Promise(function (resolve, reject) {
      const session = Session.getInstance();
      const http = new XMLHttpRequest();
      http.open(
        "GET",
        session.widgetUrl + "/widget/" + session.sdkKey + "/config"
      );
      http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      session.injectSession(http);
      http.onerror = function () {
        reject();
      };
      http.onreadystatechange = function (e) {
        if (http.readyState === XMLHttpRequest.DONE) {
          if (http.status === 200 || http.status === 201) {
            try {
              const config = JSON.parse(http.responseText);
              try {
                saveToGleapCache(`config-${session.sdkKey}`, config);
              } catch (exp) {}
              AutoConfig.applyConfig(config, soft);
              return resolve();
            } catch (e) {}
          }
          reject();
        }
      };
      http.send();
    });
  };

  /**
   * Applies the Gleap config.
   * @param {*} config
   */
  static applyConfig(config, soft) {
    try {
      const flowConfig = config.flowConfig;
      const projectActions = config.projectActions;

      if (flowConfig.color) {
        Gleap.setStyles({
          primaryColor: flowConfig.color,
          headerColor: flowConfig.headerColor,
          buttonColor: flowConfig.buttonColor,
          borderRadius: flowConfig.borderRadius,
          backgroundColor: flowConfig.backgroundColor
            ? flowConfig.backgroundColor
            : "#FFFFFF",
        });
      }

      // If it's only a soft update, return here.
      if (soft) {
        return;
      }

      if (flowConfig.logo && flowConfig.logo.length > 0) {
        Gleap.setLogoUrl(flowConfig.logo);
      }

      if (flowConfig.hideBranding) {
        Gleap.enablePoweredBy();
      }

      if (flowConfig.enableReplays) {
        Gleap.enableReplays(flowConfig.enableReplays);
      }

      Gleap.enableShortcuts(flowConfig.enableShortcuts ? true : false);

      if (flowConfig.enableNetworkLogs) {
        Gleap.enableNetworkLogger();
      }

      if (flowConfig.networkLogPropsToIgnore) {
        Gleap.setNetworkLogFilters(flowConfig.networkLogPropsToIgnore);
      }

      if (!flowConfig.enableConsoleLogs) {
        Gleap.disableConsoleLogOverwrite();
      }

      if (
        typeof flowConfig.enableCrashDetector !== "undefined" &&
        flowConfig.enableCrashDetector
      ) {
        Gleap.enableCrashDetector(true, flowConfig.enableCrashDetector);
      }

      if (
        typeof flowConfig.enableRageClickDetector !== "undefined" &&
        flowConfig.enableRageClickDetector
      ) {
        Gleap.enableRageClickDetector(flowConfig.rageClickDetectorIsSilent);
      }

      if (flowConfig.customTranslations) {
        Gleap.setCustomTranslation(flowConfig.customTranslations);
      }

      if (
        typeof flowConfig.feedbackButtonPosition !== "undefined" &&
        flowConfig.feedbackButtonPosition.length > 0
      ) {
        Gleap.setButtonType(flowConfig.feedbackButtonPosition);
      }

      if (
        typeof flowConfig.widgetButtonText !== "undefined" &&
        flowConfig.widgetButtonText.length > 0
      ) {
        Gleap.setFeedbackButtonText(flowConfig.widgetButtonText);
      }

      if (
        typeof flowConfig.hideWavingHandAfterName !== "undefined" &&
        flowConfig.hideWavingHandAfterName
      ) {
        Gleap.setWelcomeIcon("");
      }

      if (
        typeof flowConfig.hideUsersName !== "undefined" &&
        flowConfig.hideUsersName
      ) {
        Gleap.setShowUserName(false);
      }

      if (flowConfig.widgetInfoTitle && flowConfig.widgetInfoTitle.length > 0) {
        Gleap.setWidgetInfo({
          title: flowConfig.widgetInfoTitle,
        });
      }

      if (
        flowConfig.widgetInfoSubtitle &&
        flowConfig.widgetInfoSubtitle.length > 0
      ) {
        Gleap.setWidgetInfo({
          subtitle: flowConfig.widgetInfoSubtitle,
        });
      }

      if (
        flowConfig.widgetInfoDialogSubtitle &&
        flowConfig.widgetInfoDialogSubtitle.length > 0
      ) {
        Gleap.setWidgetInfo({
          dialogSubtitle: flowConfig.widgetInfoDialogSubtitle,
        });
      }

      const instance = Gleap.getInstance();
      if (
        flowConfig.enableMenu &&
        flowConfig.menuItems &&
        flowConfig.menuItems.length > 0
      ) {
        let menuItems = [];
        for (let i = 0; i < flowConfig.menuItems.length; i++) {
          let menuItem = flowConfig.menuItems[i];
          let actionFlow = null;
          let action = null;

          if (menuItem.actionType === "OPEN_INTERCOM") {
            action = function () {
              if (instance.widgetCallback) {
                return;
              }
              if (typeof Intercom !== "undefined") {
                Intercom("showNewMessage");
              }
            };
          } else if (menuItem.actionType === "REDIRECT_URL") {
            if (instance.widgetCallback) {
              action = function () {
                instance.widgetCallback("openExternalURL", {
                  url: menuItem.actionBody,
                });
              };
            } else {
              if (menuItem.actionOpenInNewTab) {
                action = function () {
                  window.open(menuItem.actionBody, "_blank").focus();
                };
              } else {
                action = function () {
                  window.location.href = menuItem.actionBody;
                };
              }
            }
          } else if (menuItem.actionType === "CUSTOM_ACTION") {
            action = function () {
              Gleap.triggerCustomAction(menuItem.actionBody);
            };
          } else {
            actionFlow = menuItem.actionType;
          }

          // Action flow
          if (actionFlow != null || action != null) {
            var item = {
              title: menuItem.title,
              description: menuItem.description,
              icon: menuItem.icon,
              color: menuItem.color,
            };
            if (actionFlow) {
              item["actionFlow"] = actionFlow;
            }
            if (action) {
              item["action"] = action;
            }
            menuItems.push(item);
          }
        }

        Gleap.setMenuOptions(menuItems);
      }

      if (projectActions) {
        Gleap.setFeedbackActions(projectActions);
      }

      if (flowConfig.buttonLogo && flowConfig.buttonLogo.length > 0) {
        Gleap.setButtonLogoUrl(flowConfig.buttonLogo);
      }
    } catch (e) {}
  }
}
