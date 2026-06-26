import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { BackendGate } from "./app/BackendGate";
import { queryClient } from "./app/queryClient";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <BackendGate>
          <App />
        </BackendGate>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
