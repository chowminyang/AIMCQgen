import { create } from "zustand";
import { queryClient } from "./queryClient";

interface ModelState {
  currentModel: "o3-mini";
  setModel: (model: "o3-mini") => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  currentModel: "o3-mini",
  setModel: async (model) => {
    try {
      await fetch("/api/settings/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model }),
      });
      set({ currentModel: model });
      // Invalidate any queries that might depend on the model
      await queryClient.invalidateQueries({ queryKey: ["/api/mcq"] });
    } catch (error) {
      console.error("Failed to update model:", error);
      throw error;
    }
  },
}));