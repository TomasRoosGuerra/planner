import React, { useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Toaster } from "react-hot-toast";
import "./App.css";
import ContextMenu from "./components/ContextMenu";
import ErrorBoundary from "./components/ErrorBoundary";
import ExportSection from "./components/ExportSection";
import Header from "./components/Header";
import ItemForm from "./components/ItemForm";
import ItemLists from "./components/ItemLists";
import Schedule from "./components/Schedule";
import { PlannerProvider } from "./context/PlannerContext";

function App() {
  useEffect(() => {
    // Add global error handler
    const handleError = (error) => {
      console.error("Global error caught:", error);
    };

    const handleUnhandledRejection = (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return (
    <ErrorBoundary>
      <PlannerProvider>
        <DndProvider backend={HTML5Backend}>
          <div className="app">
            <Header />
            <main className="main-content">
              <ItemForm />
              <ItemLists />
              <Schedule />
              <ExportSection />
            </main>
            <ContextMenu />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "rgba(255, 255, 255, 0.95)",
                  color: "#6b5b47",
                  border: "1px solid #d4c4b0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(139, 111, 71, 0.2)",
                },
              }}
            />
          </div>
        </DndProvider>
      </PlannerProvider>
    </ErrorBoundary>
  );
}

export default App;
