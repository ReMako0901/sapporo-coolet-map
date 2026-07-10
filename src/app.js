const SAPPORO_CENTER = [43.0618, 141.3545];
const DEFAULT_ZOOM = 15;
const DATA_URL = "./data/spots.geojson";

const intro = document.querySelector("#intro");
const mapPanel = document.querySelector("#map-panel");
const statusEl = document.querySelector("#status");
const mapTitle = document.querySelector("#map-title");
const spotCount = document.querySelector("#spot-count");
const spotsEl = document.querySelector("#spots");
const dataNote = document.querySelector("#data-note");
const filterCool = document.querySelector("#filter-cool");
const filterToilet = document.querySelector("#filter-toilet");

const state = {
  map: null,
  userMarker: null,
  accuracyCircle: null,
  userLatLng: null,
  spotsLayer: null,
  features: [],
};

const iconConfig = {
  cool: {
    color: "#177e89",
    label: "涼",
  },
  toilet: {
    color: "#7a5c1d",
    label: "WC",
  },
};

document.querySelector("#use-location").addEventListener("click", requestLocation);
document.querySelector("#use-sapporo").addEventListener("click", () => {
  showMap(SAPPORO_CENTER, "札幌中心部");
  setStatus("札幌中心部を表示しています。");
});
document.querySelector("#recenter").addEventListener("click", recenter);
document.querySelector("#reload-spots").addEventListener("click", loadSpots);
filterCool.addEventListener("change", renderSpots);
filterToilet.addEventListener("change", renderSpots);

async function requestLocation() {
  if (!("geolocation" in navigator)) {
    setStatus("このブラウザでは位置情報を取得できません。札幌中心部を表示します。");
    showMap(SAPPORO_CENTER, "札幌中心部");
    return;
  }

  setStatus("ブラウザの確認で位置情報の利用を許可してください。");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const coords = [position.coords.latitude, position.coords.longitude];
      showMap(coords, "現在地周辺");
      updateUserLocation(coords, position.coords.accuracy);
      setStatus("現在地を中心に地図を表示しました。");
    },
    (error) => {
      const message =
        error.code === error.PERMISSION_DENIED
          ? "位置情報が許可されなかったため、札幌中心部を表示します。"
          : "位置情報を取得できなかったため、札幌中心部を表示します。";
      setStatus(message);
      showMap(SAPPORO_CENTER, "札幌中心部");
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    },
  );
}

function showMap(center, title) {
  intro.hidden = true;
  mapPanel.hidden = false;
  mapTitle.textContent = title;

  if (!state.map) {
    state.map = L.map("map", {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(state.map);

    state.spotsLayer = L.layerGroup().addTo(state.map);
    loadSpots();
    return;
  }

  state.map.setView(center, DEFAULT_ZOOM);
  setTimeout(() => state.map.invalidateSize(), 0);
}

function updateUserLocation(coords, accuracy) {
  state.userLatLng = L.latLng(coords[0], coords[1]);

  if (!state.userMarker) {
    state.userMarker = L.marker(state.userLatLng, {
      title: "現在地",
    }).addTo(state.map);
  } else {
    state.userMarker.setLatLng(state.userLatLng);
  }

  state.userMarker.bindPopup("現在地");

  if (!state.accuracyCircle) {
    state.accuracyCircle = L.circle(state.userLatLng, {
      radius: accuracy || 0,
      color: "#cf4d2e",
      fillColor: "#cf4d2e",
      fillOpacity: 0.12,
      weight: 1,
    }).addTo(state.map);
  } else {
    state.accuracyCircle.setLatLng(state.userLatLng);
    state.accuracyCircle.setRadius(accuracy || 0);
  }
}

function recenter() {
  if (state.userLatLng) {
    state.map.setView(state.userLatLng, DEFAULT_ZOOM);
    return;
  }

  setStatus("現在地はまだ取得していません。もう一度トップから位置情報を許可してください。");
  state.map.setView(SAPPORO_CENTER, DEFAULT_ZOOM);
}

async function loadSpots() {
  if (!state.spotsLayer) return;

  try {
    setDataNote("施設データを読み込んでいます。");
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const geojson = await response.json();
    state.features = Array.isArray(geojson.features) ? geojson.features : [];
    renderSpots();
    setDataNote(
      `出典: data/spots.geojson / 最終読込: ${new Date().toLocaleString("ja-JP")}`,
    );
  } catch (error) {
    state.features = [];
    renderSpots();
    setDataNote("施設データを読み込めませんでした。data/spots.geojson を確認してください。");
    console.error(error);
  }
}

function renderSpots() {
  const visibleFeatures = state.features.filter((feature) => {
    const kind = getKind(feature);
    if (kind === "cool") return filterCool.checked;
    if (kind === "toilet") return filterToilet.checked;
    return true;
  });

  state.spotsLayer.clearLayers();
  spotsEl.replaceChildren();

  visibleFeatures.forEach((feature) => {
    const coords = getLatLng(feature);
    if (!coords) return;

    const kind = getKind(feature);
    const marker = L.marker(coords, {
      icon: makeIcon(kind),
      title: feature.properties?.name || "名称未設定",
    }).bindPopup(makePopup(feature));

    marker.addTo(state.spotsLayer);
    spotsEl.append(makeSpotItem(feature, coords, marker));
  });

  spotCount.textContent = `${visibleFeatures.length}件`;
}

function makeSpotItem(feature, coords, marker) {
  const item = document.createElement("li");
  item.className = "spot-card";
  item.dataset.kind = getKind(feature);

  const button = document.createElement("button");
  button.type = "button";
  button.addEventListener("click", () => {
    state.map.setView(coords, 17);
    marker.openPopup();
  });

  const name = document.createElement("span");
  name.className = "spot-name";
  name.textContent = feature.properties?.name || "名称未設定";

  const meta = document.createElement("span");
  meta.className = "spot-meta";
  meta.textContent = formatMeta(feature);

  button.append(name, meta);
  item.append(button);
  return item;
}

function makePopup(feature) {
  const props = feature.properties || {};
  const typeLabel = getKind(feature) === "toilet" ? "トイレ" : "涼める場所";
  const lines = [
    props.address,
    props.hours ? `利用時間: ${props.hours}` : null,
    props.note,
    props.source ? `<a href="${props.source}" target="_blank" rel="noreferrer">出典</a>` : null,
  ].filter(Boolean);

  return `
    <div class="popup-title">${escapeHtml(props.name || "名称未設定")}</div>
    <div class="popup-meta">${escapeHtml(typeLabel)}</div>
    ${lines.map((line) => `<div>${line.startsWith("<a ") ? line : escapeHtml(line)}</div>`).join("")}
  `;
}

function makeIcon(kind) {
  const config = iconConfig[kind] || iconConfig.cool;
  return L.divIcon({
    className: "",
    html: `<span style="
      display:grid;
      place-items:center;
      width:34px;
      height:34px;
      border:2px solid #fff;
      border-radius:50%;
      background:${config.color};
      color:#fff;
      box-shadow:0 4px 12px rgba(0,0,0,.28);
      font-weight:800;
      font-size:12px;
    ">${config.label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

function getKind(feature) {
  return feature.properties?.kind === "toilet" ? "toilet" : "cool";
}

function getLatLng(feature) {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return L.latLng(lat, lng);
}

function formatMeta(feature) {
  const props = feature.properties || {};
  return [props.address, props.hours, props.note].filter(Boolean).join(" / ") || "詳細未設定";
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setDataNote(message) {
  dataNote.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
