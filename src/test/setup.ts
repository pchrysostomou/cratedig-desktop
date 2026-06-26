import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// We import test fns explicitly (no vitest globals), so register RTL's DOM cleanup
// ourselves — otherwise rendered output leaks between tests.
afterEach(() => {
  cleanup();
});
