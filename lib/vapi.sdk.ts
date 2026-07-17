"use client";

import Vapi from "@vapi-ai/web";

let vapiInstance: Vapi | null = null;

export const getVapi = () => {
  if (!vapiInstance) {
    const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

    if (!token) {
      throw new Error("VAPI token missing");
    }

    vapiInstance = new Vapi(token);
  }

  return vapiInstance;
};