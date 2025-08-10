import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { MinisContainer } from "@shopify/shop-minis-react";
import { App } from "./App";

// Dev fallback so MinisContainer renders outside the native WebView
if (import.meta.env?.DEV && !(window as any).minisSDK) {
  (window as any).minisSDK = {};
  (window as any).minisParams = {
    platform: "web",
    handle: "dev",
    initialUrl: "/",
  };
  const readyPayload = JSON.stringify({ type: "MINIS_SDK_READY" });
  try {
    window.dispatchEvent(new MessageEvent("message", { data: readyPayload }));
  } catch {}
  try {
    document.dispatchEvent(
      new MessageEvent("message", { data: readyPayload } as any)
    );
  } catch {}
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MinisContainer>
      <App />
    </MinisContainer>
  </StrictMode>
);
