"use client";

import { PrivyProvider as InnerProvider } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { PrivyLogoutBridge } from "@/components/privy-logout-bridge";

export function PrivyAppProvider({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    function read() {
      const t = document.documentElement.getAttribute("data-theme");
      setTheme(t === "dark" ? "dark" : "light");
    }
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  if (!appId) return <>{children}</>;

  return (
    <InnerProvider
      appId={appId}
      config={{
        loginMethods: ["email", "sms"],
        appearance: {
          theme,
          accentColor: "#c9a14a",
          showWalletLoginFirst: false,
        },
      }}
    >
      <PrivyLogoutBridge />
      {children}
    </InnerProvider>
  );
}
