import React, { useEffect, useState, useRef } from "react";

// Single-file React App component compatible with Telegram Web App 6.1+
// Save as: src/App.jsx (or index.jsx) and build with your usual bundler.
// Features:
// - Robust detection of Telegram.WebApp (with async polling fallback)
// - Calls Telegram.WebApp.ready() as required by v6.1+
// - Handles colorScheme/themeChanged event
// - Controls MainButton & BackButton safely
// - Haptics helpers and example usage
// - Exposes sendData example and close method

export default function App() {
  const [tg, setTg] = useState(null); // Telegram.WebApp object
  const [isReady, setIsReady] = useState(false);
  const [colorScheme, setColorScheme] = useState("light");
  const mainButtonRef = useRef({ visible: false });

  // Polling-based detection for environments where window.Telegram appears late.
  // Returns the Telegram.WebApp instance or null after timeout.
  const detectTelegramWebApp = async (timeoutMs = 5000) => {
    if (typeof window === "undefined") return null;
    if (window.Telegram && window.Telegram.WebApp) return window.Telegram.WebApp;

    // If not present immediately, poll for a short time
    const start = Date.now();
    return new Promise((resolve) => {
      const iv = setInterval(() => {
        if (window.Telegram && window.Telegram.WebApp) {
          clearInterval(iv);
          resolve(window.Telegram.WebApp);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(iv);
          resolve(null);
        }
      }, 200);
    });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const webApp = await detectTelegramWebApp(8000);
      if (!mounted) return;
      if (!webApp) {
        console.warn("Telegram.WebApp not found (not inside Telegram or timed out).");
        return;
      }

      // Must call ready() explicitly for newer WebApp versions
      try {
        // some hosts implement ready as sync, some as a no-op — call guarded
        if (typeof webApp.ready === "function") {
          webApp.ready();
        }
      } catch (e) {
        console.warn("Telegram.WebApp.ready() call failed:", e);
      }

      setTg(webApp);
      // initial color scheme
      try {
        setColorScheme(webApp.colorScheme || "light");
      } catch (_) {
        setColorScheme("light");
      }

      setIsReady(true);

      // Register theme change listener
      if (typeof webApp.onEvent === "function") {
        const handler = (ev) => {
          if (ev === "themeChanged") {
            try {
              setColorScheme(webApp.colorScheme || "light");
            } catch (err) {
              console.warn("Error reading colorScheme after themeChanged", err);
            }
          }
        };
        webApp.onEvent("themeChanged", handler);

        // cleanup
        return () => {
          try {
            webApp.offEvent && webApp.offEvent("themeChanged", handler);
          } catch (_) {}
        };
      }
    })();

    return () => (mounted = false);
  }, []);

  // MainButton helpers
  useEffect(() => {
    if (!tg) return;

    try {
      // Provide a simple stateful main button API
      mainButtonRef.current = {
        show: (text = "Continue") => {
          try {
            tg.MainButton.setText(text);
            tg.MainButton.show();
            mainButtonRef.current.visible = true;
          } catch (e) {
            console.warn("MainButton.show failed", e);
          }
        },
        hide: () => {
          try {
            tg.MainButton.hide();
            mainButtonRef.current.visible = false;
          } catch (e) {
            console.warn("MainButton.hide failed", e);
          }
        },
        setText: (text) => {
          try {
            tg.MainButton.setText(text);
          } catch (e) {
            console.warn("MainButton.setText failed", e);
          }
        },
        onClick: (cb) => {
          if (typeof tg.MainButton.onClick === "function") {
            try {
              tg.MainButton.onClick(cb);
            } catch (e) {
              console.warn("MainButton.onClick failed", e);
            }
          } else if (typeof tg.onEvent === "function") {
            // fallback if older shims use events
            try {
              tg.onEvent("mainButtonClicked", cb);
            } catch (e) {
              console.warn("fallback mainButton listener failed", e);
            }
          }
        },
      };

      // Example: set default text and show
      mainButtonRef.current.setText("Start Task");
      mainButtonRef.current.show();
    } catch (e) {
      console.warn("MainButton initialization error", e);
    }

    return () => {
      try {
        // remove listener on unmount if tg provides remove
        typeof tg.MainButton.offClick === "function" && tg.MainButton.offClick();
      } catch (_) {}
    };
  }, [tg]);

  // Haptics helpers (if available)
  const haptics = {
    impact: (...args) => tg?.HapticFeedback?.impactOccurred && tg.HapticFeedback.impactOccurred(...args),
    notification: (...args) => tg?.HapticFeedback?.notificationOccurred && tg.HapticFeedback.notificationOccurred(...args),
    selection: (...args) => tg?.HapticFeedback?.selectionChanged && tg.HapticFeedback.selectionChanged(...args),
  };

  // Example: what happens when MainButton clicked
  useEffect(() => {
    if (!tg) return;
    const handler = () => {
      // trigger haptic feedback
      haptics.impact && haptics.impact("light");

      // example sendData to bot backend
      try {
        const payload = JSON.stringify({ action: "main_button_clicked", ts: Date.now() });
        // sendData will reach your bot via the WebApp's sendData mechanism
        if (typeof tg.sendData === "function") {
          tg.sendData(payload);
        } else if (typeof tg.MainButton !== "undefined") {
          // If bot expects receiving via callback_query, you may do something else here.
          console.log("tg.sendData not available — payload:", payload);
        }
      } catch (e) {
        console.warn("Error sending data", e);
      }
    };

    // attach
    try {
      if (typeof tg.MainButton.onClick === "function") tg.MainButton.onClick(handler);
      else if (typeof tg.onEvent === "function") tg.onEvent("mainButtonClicked", handler);
    } catch (e) {
      console.warn("Attaching main button handler failed", e);
    }

    return () => {
      try {
        if (typeof tg.MainButton.offClick === "function") tg.MainButton.offClick(handler);
        else if (typeof tg.offEvent === "function") tg.offEvent("mainButtonClicked", handler);
      } catch (_) {}
    };
  }, [tg]);

  // Example UI behavior functions
  const closeWebApp = () => {
    try {
      tg && typeof tg.close === "function" ? tg.close() : console.warn("tg.close not available");
    } catch (e) {
      console.warn("closeWebApp failed", e);
    }
  };

  const openLink = (url) => {
    try {
      tg && typeof tg.openLink === "function" ? tg.openLink(url) : window.open(url, "_blank");
    } catch (e) {
      console.warn("openLink failed", e);
    }
  };

  // Small debug info for developers inside the WebApp
  return (
    <div className={`min-h-screen p-4 ${colorScheme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      <header className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Telegram WebApp (v6.1+) — Fixed Entry</h1>
        <p className="mt-2 text-sm text-gray-500">Status: {isReady ? "Ready inside Telegram" : "Not running inside Telegram WebApp"}</p>
      </header>

      <main className="max-w-3xl mx-auto mt-6">
        <section className="mb-4">
          <div className="flex gap-2 items-center">
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => {
                mainButtonRef.current?.show && mainButtonRef.current.show("Do Action");
              }}
            >
              Show MainButton
            </button>

            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => mainButtonRef.current?.hide && mainButtonRef.current.hide()}
            >
              Hide MainButton
            </button>

            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => {
                haptics.notification && haptics.notification("success");
              }}
            >
              Haptic
            </button>

            <button className="px-4 py-2 rounded-lg border" onClick={() => openLink("https://example.com")}>Open Link</button>

            <button className="px-4 py-2 rounded-lg border" onClick={closeWebApp}>Close</button>
          </div>
        </section>

        <section className="bg-gray-50 p-4 rounded-lg">
          <strong>Dev info</strong>
          <pre className="mt-2 text-sm break-words">
            Telegram object: {tg ? "available" : "not available"}
            {"\n"}colorScheme: {colorScheme}
            {"\n"}MainButton visible: {mainButtonRef.current?.visible ? "yes" : "no"}
          </pre>
        </section>
      </main>

      <footer className="max-w-3xl mx-auto mt-6 text-xs text-gray-400">Built for Telegram WebApp 6.1+ compatibility</footer>
    </div>
  );
}
