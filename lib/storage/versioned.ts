export const STORAGE_VERSION = 1;

type VersionedPayload<T> = {
  storageVersion: number;
  data: T;
};

function toVersionedPayload<T>(raw: unknown): VersionedPayload<T> | null {
  if (!raw || typeof raw !== "object") return null;

  const maybeVersioned = raw as Partial<VersionedPayload<T>>;
  if (
    typeof maybeVersioned.storageVersion === "number" &&
    "data" in maybeVersioned
  ) {
    return maybeVersioned as VersionedPayload<T>;
  }

  // Treat legacy unversioned payload as v0 and migrate to v1 wrapper.
  return { storageVersion: 0, data: raw as T };
}

export function readVersionedStorage<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  fallback: T
): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    const versioned = toVersionedPayload<T>(parsed);
    if (!versioned) return fallback;

    if (isValid(versioned.data)) return versioned.data;
    return fallback;
  } catch {
    return fallback;
  }
}

export function writeVersionedStorage<T>(key: string, data: T) {
  const payload: VersionedPayload<T> = {
    storageVersion: STORAGE_VERSION,
    data,
  };
  localStorage.setItem(key, JSON.stringify(payload));
}
