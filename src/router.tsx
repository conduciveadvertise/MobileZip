import { QueryClient } from "@tanstack/react-query";
import { createRouter, createHashHistory } from "@tanstack/react-router";
import { Capacitor } from "@capacitor/core";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const isCapacitorNative = typeof window !== "undefined" && Capacitor.isNativePlatform();
  const isFileOrStatic = typeof window !== "undefined" && (window.location.protocol === "file:" || window.location.pathname.includes("index.html"));

  if (typeof window !== "undefined" && !isCapacitorNative) {
    const p = window.location.pathname;
    if (p === "/index.html" || p.endsWith("/index.html") || p === "/index.html/") {
      window.history.replaceState(null, "", "/");
    }
  }

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    notFoundMode: "root",
    ...(isCapacitorNative || isFileOrStatic ? { history: createHashHistory() } : {}),
  });

  return router;
};
