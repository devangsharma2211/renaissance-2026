import React from "react";
import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";
import App from "./App";
import securityManager from "./utils/securityManager";

if (import.meta.env.PROD) {
  securityManager.initializeAllSecurity();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
