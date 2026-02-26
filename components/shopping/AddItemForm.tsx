"use client";

import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export default function AddItemForm({ onAdd }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    onAdd(name);
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        className="w-full rounded-md border px-3 py-2"
        placeholder="Add an item (e.g., eggs)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="rounded-md bg-black text-white px-4 py-2"
      >
        Add
      </button>
    </form>
  );
}