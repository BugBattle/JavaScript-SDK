import $ from "jquery";

export const startScreenCapture = (mainColor, snapshotPosition) => {
  return checkOnlineStatus(window.location.origin).then((status) => {
    if (status && status.up) {
      return prepareScreenshotData(snapshotPosition, true);
    } else {
      return prepareScreenshotData(snapshotPosition, false);
    }
  });
};

const checkOnlineStatus = (url) => {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const status = JSON.parse(xhr.responseText);
        resolve(status);
      }
    };
    xhr.ontimeout = function () {
      reject();
    };
    xhr.onerror = function () {
      reject();
    };
    xhr.open(
      "GET",
      "https://uptime.bugbattle.io/?url=" + encodeURIComponent(url),
      true
    );
    xhr.send(null);
  });
};

export const isMobile = () => {
  if (
    /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
      navigator.userAgent
    ) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
      navigator.userAgent.substr(0, 4)
    )
  ) {
    return true;
  }
  return false;
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

  html += clone.prop("outerHTML");
  return html;
};

const fetchLinkItemResource = (elem, proxy = false) => {
  return new Promise((resolve, reject) => {
    var isCSS =
      elem.href.includes(".css") ||
      (elem.rel && elem.rel.includes("stylesheet"));
    if (elem && elem.href && isCSS) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        $(
          '<style type="text/css">' + xhr.responseText + "</style>"
        ).insertAfter(elem);
        elem.remove();
        resolve();
      };
      xhr.onerror = function (err) {
        // Retry with proxy.
        if (proxy === false) {
          fetchLinkItemResource(elem, true)
            .then(() => {
              resolve();
            })
            .catch(() => {
              resolve();
            });
        } else {
          resolve();
        }
      };
      xhr.open("GET", elem.href);
      xhr.send();
    } else {
      resolve();
    }
  });
};

const downloadAllScripts = (dom) => {
  let linkItems = dom.find("link");
  let linkItemsPromises = [];
  for (var i = 0; i < linkItems.length; i++) {
    let item = linkItems[i];
    linkItemsPromises.push(fetchLinkItemResource(item));
  }

  return Promise.all(linkItemsPromises);
};

const fetchItemResource = (elem, proxy = false) => {
  return new Promise((resolve, reject) => {
    if (elem && elem.src) {
      var xhr = new XMLHttpRequest();
      xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
          elem.src = reader.result;
          resolve();
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = function (err) {
        // Retry with proxy.
        if (proxy === false) {
          fetchItemResource(elem, true)
            .then(() => {
              resolve();
            })
            .catch(() => {
              resolve();
            });
        } else {
          resolve();
        }
      };
      var url = elem.src;
      if (proxy) {
        url =
          "https://jsproxy.bugbattle.io/?url=" + encodeURIComponent(elem.src);
      }
      xhr.open("GET", url);
      xhr.responseType = "blob";
      xhr.send();
    } else {
      resolve();
    }
  });
};

const downloadAllImages = (dom) => {
  let imgItems = dom.find("img");
  let imgItemsPromises = [];
  for (var i = 0; i < imgItems.length; i++) {
    let item = imgItems[i];
    imgItemsPromises.push(fetchItemResource(item));
  }

  return Promise.all(imgItemsPromises);
};

const optionallyPrepareRemoteData = (clone, remote) => {
  return new Promise((resolve, reject) => {
    if (remote) {
      resolve();
    } else {
      return downloadAllImages(clone).then(() => {
        return downloadAllScripts(clone).then(() => {
          resolve();
        });
      });
    }
  });
};

const prepareScreenshotData = (snapshotPosition, remote) => {
  return new Promise((resolve, reject) => {
    $(window.document)
      .find("iframe, video, embed, img, svg")
      .each(function () {
        var height = 0;

        if ($(this).css("box-sizing") === "border-box") {
          height = $(this).outerHeight();
        } else {
          height = $(this).height();
        }

        $(this).attr("bb-element", true);
        $(this).attr("bb-height", height);
      });

    let clone = $(window.document.documentElement).clone(true, true);

    clone.find("select, textarea, input").each(function () {
      const tagName = $(this).prop("tagName").toUpperCase();
      if (
        tagName === "SELECT" ||
        tagName === "TEXTAREA" ||
        tagName === "INPUT"
      ) {
        $(this).attr("bb-data-value", $(this).val());
        if (
          $(this).prop("type") === "checkbox" ||
          $(this).prop("type") === "radio"
        ) {
          if ($(this).prop("checked") === true) {
            $(this).attr("bb-data-checked", "true");
          }
        }
      }
    });

    // Cleanup
    $(window.document)
      .find("[bb-element=true]")
      .each(function () {
        $(this).attr("bb-element", null);
        $(this).attr("bb-height", null);
      });

    clone.find("script, noscript").remove();

    // Cleanup base path
    clone.remove("base");
    clone.find("head").prepend('<base href="' + window.location.origin + '">');

    clone.find(".bugbattle--feedback-dialog-container").remove();
    clone.find(".bugbattle-screenshot-editor-borderlayer").remove();

    clone.find("[bb-element=true]").each(function () {
      $(this).css("height", $(this).attr("bb-height"));
    });

    optionallyPrepareRemoteData(clone, remote).then(() => {
      let html = documentToHTML(clone);

      resolve({
        html: html,
        baseUrl: window.location.origin,
        x: snapshotPosition.x,
        y: snapshotPosition.y,
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: isMobile(),
      });
    });
  });
};
