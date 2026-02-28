"use client";

import { useCallback, useEffect, useState } from "react";
import { isShoppingItemArray } from "@/lib/storage/schemas";
import { readVersionedStorage, writeVersionedStorage } from "@/lib/storage/versioned";
import type { ShoppingItem, ShoppingItemSource } from "@/types/shopping";

const STORAGE_KEY = "shopping-list";

type NewShoppingItem = {
  name: string;
  quantity?: number;
  unit?: string;
  source?: ShoppingItemSource;
};

function makeId() {
  return crypto.randomUUID();
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

function sanitizeShoppingItem(item: ShoppingItem): ShoppingItem {
  const normalizedName = item.normalizedName ?? normalizeName(item.name);
  return {
    ...item,
    source: item.source ?? "manual",
    normalizedName,
  };
}

function mergeItems(existingList: ShoppingItem[], incoming: NewShoppingItem[]) {
  const sanitizedExisting = existingList.map(sanitizeShoppingItem);
  const existingNames = new Set(sanitizedExisting.map((item) => item.normalizedName));
  const newItems: ShoppingItem[] = [];

  for (const incomingItem of incoming) {
    const name = incomingItem.name.trim();
    if (!name) continue;

    const normalized = normalizeName(name);
    if (existingNames.has(normalized)) continue;

    existingNames.add(normalized);
    newItems.push({
      id: makeId(),
      name,
      quantity: incomingItem.quantity,
      unit: incomingItem.unit,
      source: incomingItem.source ?? "manual",
      normalizedName: normalized,
      checked: false,
    });
  }

  return {
    merged: newItems.length > 0 ? [...newItems, ...sanitizedExisting] : sanitizedExisting,
    addedCount: newItems.length,
  };
}

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load once on mount (client only)
  useEffect(() => {
    try {
      const stored = readVersionedStorage(STORAGE_KEY, isShoppingItemArray, []);
      setItems(stored.map(sanitizeShoppingItem));
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save whenever items change
  useEffect(() => {
    if (!hydrated) return;
    writeVersionedStorage(STORAGE_KEY, items.map(sanitizeShoppingItem));
  }, [items, hydrated]);

  const addItem = useCallback((name: string) => {
    setItems((prev) => mergeItems(prev, [{ name, source: "manual" }]).merged);
  }, []);

  const addItems = useCallback((names: string[]) => {
    let addedCount = 0;
    setItems((prev) => {
      const result = mergeItems(
        prev,
        names.map((name) => ({ name, source: "recipe" as const }))
      );
      addedCount = result.addedCount;
      return result.merged;
    });
    return addedCount;
  }, []);

  const addDetailedItems = useCallback((incoming: NewShoppingItem[]) => {
    let addedCount = 0;
    setItems((prev) => {
      const result = mergeItems(prev, incoming);
      addedCount = result.addedCount;
      return result.merged;
    });
    return addedCount;
  }, []);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearChecked = useCallback(() => {
    setItems((prev) => prev.map((it) => (it.checked ? { ...it, checked: false } : it)));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    hydrated,
    addItem,
    addItems,
    addDetailedItems,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
  };
}
