export const requiredOrigin = "https://www.shacknews.com/chatty*";

const requestPermissions = async () => {
  return new Promise((resolve, reject) =>
    browser.permissions.request({ origins: [requiredOrigin] }, (response) => {
      if (response) {
        console.log("Permission granted!");
        return resolve(true);
      }
      console.error("Permission denied!");
      return reject(false);
    }),
  );
};

const getCurrentPermissions = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    browser.permissions.contains({ origins: [requiredOrigin] }, (response) => {
      if (response) return resolve(true);
      return reject(false);
    });
  });
};

const setPanelState = (granted: boolean) => {
  const permissionBtn = document.getElementById("permissionBtn");
  const prompt = document.getElementById("prompt");
  const grantText = document.getElementById("granted");
  if (!prompt || !grantText || !permissionBtn) return;
  if (granted) {
    prompt.setAttribute("class", "hide");
    grantText.removeAttribute("class");
    permissionBtn.innerText = "Permission Granted";
    permissionBtn.setAttribute("disabled", "true");
    permissionBtn.setAttribute("class", "hide");
  } else {
    prompt.removeAttribute("class");
    grantText.setAttribute("class", "hide");
    permissionBtn.innerText = "Request Permission";
    permissionBtn.removeAttribute("disabled");
    permissionBtn.setAttribute("class", "");
  }
};

const initialize = async () => {
  const permissionBtn = document.getElementById("permissionBtn");
  if (permissionBtn) permissionBtn.addEventListener("click", requestPermissions);

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "permissions_granted" && permissionBtn) setPanelState(true);
    else if (message.type === "permissions_removed" && permissionBtn) setPanelState(false);
  });

  try {
    const currentPermissions = await getCurrentPermissions();
    if (permissionBtn) setPanelState(currentPermissions);
  } catch (e) {
    if (permissionBtn) setPanelState(false);
    console.error(e);
  }
};

(async () => {
  if (import.meta.env.BROWSER === "firefox" && import.meta.env.MANIFEST_VERSION === 3) {
    await initialize();
  }
})();
