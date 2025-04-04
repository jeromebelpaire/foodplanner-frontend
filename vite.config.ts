import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

export default defineConfig(({ command }) => {
  // Only include HTTPS configuration when running the dev server
  if (command === "serve") {
    return {
      plugins: [react()],
      server: {
        https: {
          key: fs.readFileSync("C:/Windows/System32/localhost+1-key.pem"),
          cert: fs.readFileSync("C:/Windows/System32/localhost+1.pem"),
        },
      },
    };
  }
  // For production (build), do not include HTTPS config
  return {
    plugins: [react()],
  };
});
