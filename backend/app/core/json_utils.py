from __future__ import annotations

import json


def parse_json_object_from_text(content: str, source_label: str) -> dict:
    trimmed = content.strip()
    if not trimmed:
        raise ValueError(f"{source_label} returned an empty response.")

    attempts: list[str] = [trimmed]

    fenced_start = trimmed.find("```")
    if fenced_start >= 0:
        fenced_end = trimmed.find("```", fenced_start + 3)
        if fenced_end > fenced_start:
            fenced_body = trimmed[fenced_start + 3 : fenced_end].strip()
            if fenced_body.lower().startswith("json"):
                fenced_body = fenced_body[4:].strip()
            if fenced_body:
                attempts.append(fenced_body)

    object_start = trimmed.find("{")
    object_end = trimmed.rfind("}")
    if object_start >= 0 and object_end > object_start:
        attempts.append(trimmed[object_start : object_end + 1].strip())

    for attempt in attempts:
        try:
            parsed = json.loads(attempt)
        except json.JSONDecodeError:
            continue

        if isinstance(parsed, dict):
            return parsed

    raise ValueError(f"{source_label} returned invalid JSON.")
