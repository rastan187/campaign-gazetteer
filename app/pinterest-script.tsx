"use client";

import { useEffect } from "react";

const PINTEREST_SCRIPT_ID = "pinterest-board-script";

export function PinterestScript() {
  useEffect(() => {
    if (document.getElementById(PINTEREST_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = PINTEREST_SCRIPT_ID;
    script.src = "https://assets.pinterest.com/js/pinit.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
