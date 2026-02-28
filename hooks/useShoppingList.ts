"use client";

import { useEffect, useState } from "react";
import type { ShoppingItem } from "@/types/shopping";

const STORAGE_KEY = "shopping-list";

function makeId() {
  return crypto.randomUUID();
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore bad/corrupted storage
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save whenever items change
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(name: string) {
    setItems((prev) => [
      { id: makeId(), name, checked: false },
      ...prev,
    ]);
  }

  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, checked: !it.checked } : it
      )
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function clearChecked() {
    setItems((prev) =>
      prev.map((it) => (it.checked ? { ...it, checked: false } : it))
    );
  }

  function clearAll() {
    setItems([]);
  }

  return {
    items,
    hydrated,
    addItem,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
  };
}
