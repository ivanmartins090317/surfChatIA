"use client";

import dynamic from "next/dynamic";
import { Toaster } from "sonner";

function AppToasterView() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        classNames: {
          toast: "glass border-border text-foreground",
        },
      }}
    />
  );
}

export const AppToaster = dynamic(() => Promise.resolve(AppToasterView), {
  ssr: false,
});
