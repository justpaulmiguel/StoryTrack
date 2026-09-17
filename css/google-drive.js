// Google Drive sync for StoryTrack.
// Uses Google Identity Services + the least-privileged Drive scope.
const DRIVE_CONFIG = {
  clientId: "304550881020-jfr57ntlpda0coknokdkqajjfer352m5.apps.googleusercontent.com",
  fileName: "media.json",
  scope: "https://www.googleapis.com/auth/drive.file"
};

const DRIVE_FILE_KEY = "storytrack_drive_file_id";
let driveTokenClient = null;
let driveAccessToken = null;

function setDriveStatus(text, state="") {
  const el = $("driveStatus");
  if (!el) return;
  el.textContent = text;
  el.className = "drive-status" + (state ? " " + state : "");
}

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.querySelector('script[data-google-gis="1"]');
    if (existing) {
      existing.addEventListener("load", resolve, {once:true});
      existing.addEventListener("error", () => reject(new Error("Google Identity Services could not load.")), {once:true});
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGis = "1";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Google Identity Services could not load."));
    document.head.appendChild(script);
  });
}

async function getDriveToken() {
  await loadGis();
  return new Promise((resolve, reject) => {
    driveTokenClient = google.accounts.oauth2.initTokenClient({
      client_id: DRIVE_CONFIG.clientId,
      scope: DRIVE_CONFIG.scope,
      callback: response => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        driveAccessToken = response.access_token;
        resolve(response.access_token);
      }
    });
    driveTokenClient.requestAccessToken({prompt: ""});
  });
}

async function driveFetch(url, options={}) {
  const token = driveAccessToken || await getDriveToken();
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(url, {...options, headers});
  if (response.status === 401) {
    driveAccessToken = null;
    const retryToken = await getDriveToken();
    headers.set("Authorization", `Bearer ${retryToken}`);
    return fetch(url, {...options, headers});
  }
  return response;
}

async function findDriveFile() {
  const savedId = localStorage.getItem(DRIVE_FILE_KEY);
  if (savedId) {
    const check = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(savedId)}?fields=id,name,trashed`);
    if (check.ok) {
      const file = await check.json();
      if (!file.trashed) return file;
    }
    localStorage.removeItem(DRIVE_FILE_KEY);
  }

  const q = encodeURIComponent(`name = '${DRIVE_CONFIG.fileName}' and trashed = false`);
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=10&fields=files(id,name,modifiedTime)`);
  if (!response.ok) throw new Error(`Drive file search failed (${response.status}).`);
  const data = await response.json();
  return data.files?.[0] || null;
}

async function createDriveFile() {
  const response = await driveFetch("https://www.googleapis.com/drive/v3/files?fields=id,name", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({name: DRIVE_CONFIG.fileName, mimeType: "application/json"})
  });
  if (!response.ok) throw new Error(`Could not create the Drive file (${response.status}).`);
  const file = await response.json();
  localStorage.setItem(DRIVE_FILE_KEY, file.id);
  return file;
}

async function readDriveJson(fileId) {
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`);
  if (!response.ok) throw new Error(`Could not read media.json (${response.status}).`);
  const text = await response.text();
  if (!text.trim()) return {items: [], customTypes: []};
  const data = JSON.parse(text);
  return {
    items: Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []),
    customTypes: Array.isArray(data.customTypes) ? data.customTypes : []
  };
}

async function writeDriveJson(fileId, payload) {
  const body = JSON.stringify(payload, null, 2);
  const response = await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body
  });
  if (!response.ok) throw new Error(`Could not save media.json (${response.status}).`);
}

function mergeDriveData(cloud) {
  const byId = new Map();
  (cloud.items || []).forEach(x => { if (x?.id) byId.set(x.id, x); });
  (items || []).forEach(x => {
    if (!x?.id) return;
    const existing = byId.get(x.id);
    if (!existing || (x.updated || 0) >= (existing.updated || 0)) byId.set(x.id, x);
  });
  const mergedItems = Array.from(byId.values());
  const mergedTypes = Array.from(new Set([...(cloud.customTypes || []), ...(customTypes || [])]));
  return {items: mergedItems, customTypes: mergedTypes};
}

async function syncToDrive() {
  const button = $("driveSync");
  if (button) button.disabled = true;
  setDriveStatus("Connecting…", "working");
  try {
    const token = await getDriveToken();
    if (!token) throw new Error("Google authorization did not return an access token.");

    let file = await findDriveFile();
    if (!file) {
      file = await createDriveFile();
      const payload = {version: 2, exportedAt: Date.now(), items, customTypes};
      await writeDriveJson(file.id, payload);
    } else {
      const cloud = await readDriveJson(file.id);
      const merged = mergeDriveData(cloud);
      items = merged.items;
      customTypes = merged.customTypes;
      localStorage.setItem(KEY, JSON.stringify(items));
      localStorage.setItem(TYPE_KEY, JSON.stringify(customTypes));
      populateTypeSelects();
      render();
      await writeDriveJson(file.id, {version: 2, exportedAt: Date.now(), items, customTypes});
    }

    localStorage.setItem(DRIVE_FILE_KEY, file.id);
    setDriveStatus("Drive synced", "good");
    alert("StoryTrack is synced with Google Drive.");
  } catch (error) {
    console.error(error);
    setDriveStatus("Drive sync failed", "bad");
    alert(`Google Drive sync failed.\n\n${error.message}`);
  } finally {
    if (button) button.disabled = false;
  }
}
