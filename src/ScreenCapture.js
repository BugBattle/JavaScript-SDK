import { isMobile, resizeImage } from "./ImageHelper";
import { isBlacklisted } from "./ResourceExclusionList";

export const startScreenCapture = (snapshotPosition, isLiveSite) => {
  return prepareScreenshotData(snapshotPosition, isLiveSite);
};

const documentToHTML = (clone) => {
  var html = "";
  var node = window.document.doctype;
  if (node) {
    html =
      "<!DOCTYPE " +
      node.name +
      (node.publicId ? ' PUBLIC "' + node.publicId + '"' : "") +
      (!node.publicId && node.systemId ? " SYSTEM" : "") +
      (node.systemId ? ' "' + node.systemId + '"' : "") +
      ">";
  }

  html += clone.outerHTML;
  return html;
};

const replaceAsync = (str, regex, asyncFn) => {
  return new Promise((resolve, reject) => {
    const promises = [];
    str.replace(regex, (match, ...args) => {
      const promise = asyncFn(match, ...args);
      promises.push(promise);
    });
    Promise.all(promises)
      .then((data) => {
        resolve(str.replace(regex, () => data.shift()));
      })
      .catch(() => {
        reject();
      });
  });
};

const loadCSSUrlResources = (data, basePath) => {
  return replaceAsync(
    data,
    /url\((.*?)\)/g,
    (matchedData) =>
      new Promise((resolve, reject) => {
        if (!matchedData) {
          return resolve(matchedData);
        }

        var matchedUrl = matchedData
          .substr(4, matchedData.length - 5)
          .replaceAll("'", "")
          .replaceAll('"', "");

        // Remote file or data
        if (
          matchedUrl.indexOf("http") === 0 ||
          matchedUrl.indexOf("//") === 0 ||
          matchedUrl.indexOf("data") === 0
        ) {
          return resolve(matchedData);
        }

        try {
          var resourcePath = matchedUrl;
          if (basePath) {
            resourcePath = basePath + "/" + matchedUrl;
          }

          return fetchCSSResource(resourcePath).then((resourceData) => {
            return resolve("url(" + resourceData + ")");
          });
        } catch (exp) {
          return resolve(matchedData);
        }
      })
  );
};

const fetchCSSResource = (url) => {
  return new Promise((resolve, reject) => {
    if (url) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
          resolve(reader.result);
        };
        reader.onerror = function () {
          reject();
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = function (err) {
        resolve();
      };
      xhr.open("GET", url);
      xhr.responseType = "blob";
      xhr.send();
    } else {
      resolve();
    }
  });
};

const progressResource = (data, elem, resolve, reject) => {
  resizeImage(data, 500, 500)
    .then((data) => {
      elem.src = data;
      resolve();
    })
    .catch(() => {
      console.warn("BB: Image resize failed.");
      resolve();
    });
};

const fetchItemResource = (elem) => {
  return new Promise((resolve, reject) => {
    if (elem && elem.src) {
      if (isBlacklisted(elem.src)) {
        return resolve();
      }

      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
          progressResource(reader.result, elem, resolve, reject);
        };
        reader.onerror = function () {
          resolve();
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = function (err) {
        resolve();
      };
      var url = elem.src;
      xhr.open("GET", url);
      xhr.responseType = "blob";
      xhr.send();
    } else {
      resolve();
    }
  });
};

const downloadAllImages = (dom) => {
  const imgItems = dom.querySelectorAll("img");
  const imgItemsPromises = [];
  for (var i = 0; i < imgItems.length; i++) {
    const item = imgItems[i];
    imgItemsPromises.push(fetchItemResource(item));
  }

  return Promise.all(imgItemsPromises);
};

const replaceStyleNodes = (clone, styleSheet, cssTextContent) => {
  {
    var cloneTargetNode = null;
    if (styleSheet.ownerNode) {
      cloneTargetNode = clone.querySelector(
        '[bb-styleid="' + styleSheet.ownerNode.getAttribute("bb-styleid") + '"]'
      );
    }

    try {
      if (cloneTargetNode) {
        var replacementNode = null;
        if (cssTextContent != "") {
          // Create node.
          const head = clone.querySelector("head");
          var styleNode = window.document.createElement("style");
          head.appendChild(styleNode);
          styleNode.type = "text/css";
          if (styleNode.styleSheet) {
            styleNode.styleSheet.cssText = cssTextContent;
          } else {
            styleNode.appendChild(
              window.document.createTextNode(cssTextContent)
            );
          }
          replacementNode = styleNode;
        } else {
          var linkNode = window.document.createElement("link");
          linkNode.rel = "stylesheet";
          linkNode.type = styleSheet.type;
          linkNode.href = styleSheet.href;
          linkNode.media = styleSheet.media;
          replacementNode = linkNode;
        }

        if (replacementNode) {
          cloneTargetNode.parentNode.insertBefore(
            replacementNode,
            cloneTargetNode
          );
          cloneTargetNode.remove();
        }
      }
    } catch (exp) {}
  }
};

const downloadAllCSSUrlResources = (clone, remote) => {
  var promises = [];
  for (var i = 0; i < document.styleSheets.length; i++) {
    const styleSheet = document.styleSheets[i];

    var cssRules = null;
    try {
      if (styleSheet.cssRules) {
        cssRules = styleSheet.cssRules;
      } else if (styleSheet.rules) {
        cssRules = styleSheet.rules;
      }
    } catch (exp) {}

    var cssTextContent = "";
    if (cssRules) {
      for (var cssRuleItem in cssRules) {
        if (cssRules[cssRuleItem].cssText) {
          cssTextContent += cssRules[cssRuleItem].cssText;
        }
      }
    }

    if (cssTextContent != "" && styleSheet.href && !remote) {
      // Resolve resources.
      const basePath = styleSheet.href.substring(
        0,
        styleSheet.href.lastIndexOf("/")
      );

      promises.push(
        loadCSSUrlResources(cssTextContent, basePath).then((replacedStyle) => {
          return {
            styletext: replacedStyle,
            stylesheet: styleSheet,
          };
        })
      );
    } else {
      promises.push(
        Promise.resolve({
          styletext: "",
          stylesheet: styleSheet,
        })
      );
    }
  }

  return Promise.all(promises).then((results) => {
    if (results) {
      for (var i = 0; i < results.length; i++) {
        replaceStyleNodes(clone, results[i].stylesheet, results[i].styletext);
      }
    }
    return true;
  });
};

const prepareRemoteData = (clone, remote) => {
  return new Promise((resolve, reject) => {
    if (remote) {
      // Always download CSS.
      return downloadAllCSSUrlResources(clone, remote)
        .then(() => {
          resolve();
        })
        .catch(() => {
          resolve();
        });
    } else {
      return downloadAllImages(clone)
        .then(() => {
          return downloadAllCSSUrlResources(clone, remote).then(() => {
            resolve();
          });
        })
        .catch(() => {
          console.warn(
            "Gleap: Failed with resolving local resources. Please contact the Gleap support team."
          );
          resolve();
        });
    }
  });
};

const prepareScreenshotData = (snapshotPosition, remote) => {
  return new Promise((resolve, reject) => {
    const imgElems = window.document.querySelectorAll(
      "iframe, video, embed, img, svg"
    );
    for (var i = 0; i < imgElems.length; ++i) {
      const elem = imgElems[i];
      var height = 0;

      if (elem.style.boxSizing === "border-box") {
        height =
          elem.height +
          elem.marginTop +
          elem.marginBottom +
          elem.bordorTop +
          elem.borderBottom;
      } else {
        height = elem.height;
      }

      elem.setAttribute("bb-element", true);
      elem.setAttribute("bb-height", height);
    }

    // Prepare canvas
    const canvasElems = window.document.querySelectorAll("canvas");
    for (var i = 0; i < canvasElems.length; ++i) {
      canvasElems[i].setAttribute("bb-canvas-data", canvasElems[i].toDataURL());
    }

    const styleTags = window.document.querySelectorAll("style, link");
    for (var i = 0; i < styleTags.length; ++i) {
      styleTags[i].setAttribute("bb-styleid", i);
    }

    const divElems = window.document.querySelectorAll("div");
    for (var i = 0; i < divElems.length; ++i) {
      const elem = divElems[i];
      if (elem.scrollTop > 0 || elem.scrollLeft > 0) {
        elem.setAttribute("bb-scrollpos", true);
        elem.setAttribute("bb-scrolltop", elem.scrollTop);
        elem.setAttribute("bb-scrollleft", elem.scrollLeft);
      }
    }

    const clone = window.document.documentElement.cloneNode(true);

    // Fix for web imports (depracted).
    const linkImportElems = clone.querySelectorAll("link[rel=import]");
    for (var i = 0; i < linkImportElems.length; ++i) {
      const referenceNode = linkImportElems[i];
      if (
        referenceNode &&
        referenceNode.childNodes &&
        referenceNode.childNodes.length > 0
      ) {
        const childNodes = referenceNode.childNodes;
        while (childNodes.length > 0) {
          referenceNode.parentNode.insertBefore(childNodes[0], referenceNode);
        }
        referenceNode.remove();
      }
    }

    // Copy values
    const selectElems = clone.querySelectorAll("select, textarea, input");
    for (var i = 0; i < selectElems.length; ++i) {
      const elem = selectElems[i];
      const tagName = elem.tagName ? elem.tagName.toUpperCase() : elem.tagName;
      if (
        tagName === "SELECT" ||
        tagName === "TEXTAREA" ||
        tagName === "INPUT"
      ) {
        elem.setAttribute("bb-data-value", elem.value);
        if (elem.type === "checkbox" || elem.type === "radio") {
          if (elem.checked) {
            elem.setAttribute("bb-data-checked", true);
          }
        }
      }
    }

    // Cleanup
    const allElems = window.document.querySelectorAll("*");
    for (var i = 0; i < allElems.length; ++i) {
      const elem = allElems[i];
      elem.removeAttribute("bb-element");
      elem.removeAttribute("bb-height");
      elem.removeAttribute("bb-canvas-data");
    }

    // Remove all scripts & style
    const scriptElems = clone.querySelectorAll("script, noscript, style");
    for (var i = 0; i < scriptElems.length; ++i) {
      scriptElems[i].remove();
    }

    // Cleanup base path
    const baseElems = clone.querySelectorAll("base");
    for (var i = 0; i < baseElems.length; ++i) {
      baseElems[i].remove();
    }

    // Fix base node
    const baseUrl =
      window.location.href.substring(0, window.location.href.lastIndexOf("/")) +
      "/";
    const baseNode = window.document.createElement("base");
    baseNode.href = baseUrl;
    const head = clone.querySelector("head");
    head.insertBefore(baseNode, head.firstChild);

    // Do further cleanup.
    const dialogElems = clone.querySelectorAll(
      ".bb-feedback-dialog-container, .bb-screenshot-editor-borderlayer"
    );
    for (var i = 0; i < dialogElems.length; ++i) {
      dialogElems[i].remove();
    }

    // Calculate heights
    const bbElems = clone.querySelectorAll("[bb-element=true]");
    for (var i = 0; i < bbElems.length; ++i) {
      bbElems[i].style.height = bbElems[i].getAttribute("bb-height");
    }

    prepareRemoteData(clone, remote).then(() => {
      const html = documentToHTML(clone);

      resolve({
        html: html,
        baseUrl: baseUrl,
        x: snapshotPosition.x,
        y: snapshotPosition.y,
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: isMobile(),
      });
    });
  });
};
