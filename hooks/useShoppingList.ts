"use client";

import { useEffect, useState } from "react";
import type { ShoppingItem } from "@/types/shopping";

const STORAGE_KEY = "shopping-list";

function makeId() {
  return crypto.randomUUID();
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function mergeItems(existingList: ShoppingItem[], incomingNames: string[]) {
  const existingNames = new Set(existingList.map((item) => normalizeName(item.name)));
  const newItems: ShoppingItem[] = [];

  for (const rawName of incomingNames) {
    const name = rawName.trim();
    if (!name) continue;

    const normalized = normalizeName(name);
    if (existingNames.has(normalized)) continue;

    existingNames.add(normalized);
    newItems.push({ id: makeId(), name, checked: false });
  }

  return {
    merged: newItems.length > 0 ? [...newItems, ...existingList] : existingList,
    addedCount: newItems.length,
  };
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
    setItems((prev) => mergeItems(prev, [name]).merged);
  }

  function addItems(names: string[]) {
    let addedCount = 0;
    setItems((prev) => {
      const result = mergeItems(prev, names);
      addedCount = result.addedCount;
      return result.merged;
    });
    return addedCount;
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
    addItems,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
  };
}
