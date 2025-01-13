import { create } from "zustand";
import { queryClient } from "./queryClient";

interface ModelState {
  currentModel: "o1-mini" | "o1-preview";
  setModel: (model: "o1-mini" | "o1-preview") => Promise<void>;
}

// Get the stored model from localStorage or default to "o1-mini"
const getStoredModel = (): "o1-mini" | "o1-preview" => {
  const stored = localStorage.getItem("selectedModel");
  return (stored === "o1-preview" ? "o1-preview" : "o1-mini");
};

export const useModelStore = create<ModelState>((set) => ({
  currentModel: getStoredModel(),
  setModel: async (model) => {
    try {
      await fetch("/api/settings/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model }),
      });
      // Store the selection in localStorage
      localStorage.setItem("selectedModel", model);
      set({ currentModel: model });
      // Invalidate any queries that might depend on the model
      await queryClient.invalidateQueries({ queryKey: ["/api/mcq"] });
    } catch (error) {
      console.error("Failed to update model:", error);
      throw error;
    }
  },
}));