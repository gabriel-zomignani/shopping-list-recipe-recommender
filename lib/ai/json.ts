export function parseJsonObjectFromText(content: string, sourceLabel: string): unknown {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error(`${sourceLabel} returned an empty response.`);
  }

  const attempts: string[] = [trimmed];

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    attempts.push(fencedMatch[1].trim());
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    attempts.push(trimmed.slice(objectStart, objectEnd + 1).trim());
  }

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      continue;
    }
  }

  throw new Error(`${sourceLabel} returned invalid JSON.`);
}
