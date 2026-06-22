// src/config.js

// 🎚️ TOGGLE THIS: Set to 'true' for Cloud, 'false' for Local
export const USE_CLOUD_ASSETS = true; 

const CLOUD_URL = "https://renassetts.pages.dev";

// src/config.js
export const getAsset = (path) => {
  const base = import.meta.env.BASE_URL || '/';

  const cleanPath = path.startsWith("/")
    ? path.slice(1)
    : path;

  if (USE_CLOUD_ASSETS) {
    return `${CLOUD_URL}/${cleanPath}`;
  }

  return `${base}${cleanPath}`;
};
