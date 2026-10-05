"""Contracts for independent painted-panel packages and their evidence."""

import hashlib
import re
from urllib.parse import urlsplit

SOURCE_PATHS = {"src/lib/palette.js", "src/lib/cast.js", "src/scenes/panels.js"}
LANES = {"sol", "astra", "opus", "fable"}


def validate_package(payload: dict) -> dict[str, str]:
    if not isinstance(payload, dict) or type(payload.get("schema_version")) is not int or payload["schema_version"] != 1:
        raise ValueError("unsupported package schema")
    items = payload.get("files")
    if not isinstance(items, list) or len(items) != 3:
        raise ValueError("exactly three source files are required")
    result = {}
    for item in items:
        if not isinstance(item, dict):
            raise ValueError("invalid source item")
        path, content = item.get("path"), item.get("content")
        if path not in SOURCE_PATHS or path in result or not isinstance(content, str):
            raise ValueError("invalid, missing or duplicate source path/content")
        result[path] = content
    if set(result) != SOURCE_PATHS or sum(len(v.encode("utf-8")) for v in result.values()) > 256 * 1024:
        raise ValueError("incomplete or oversized authored package")
    return result


def validate_receipt(receipt: dict, expected_model: str) -> None:
    if (receipt.get("verified_model") != expected_model
            or receipt.get("evidence_kind") not in {"returned-model", "session-selection"}
            or not receipt.get("evidence_source") or receipt.get("completed") is not True
            or not re.fullmatch(r"[0-9a-f]{64}", str(receipt.get("output_sha256", "")))):
        raise ValueError("completed output lacks matching authoritative model evidence")


def validate_manifest(manifest: dict, public: bool) -> None:
    if (not re.fullmatch(r"[0-9a-f]{64}", str(manifest.get("sha256", "")))
            or not manifest.get("version") or not manifest.get("license")
            or not manifest.get("clearance_status") or not manifest.get("visibility")):
        raise ValueError("incomplete asset provenance")
    if public:
        if manifest["visibility"] != "public" or manifest["clearance_status"] not in {"cleared", "text-cleared", "code-cleared"}:
            raise ValueError("asset is not cleared for public staging")
        if any(k in manifest for k in ("local_path", "private_location", "raw_receipt", "account_id", "download_url")):
            raise ValueError("private asset metadata cannot be public")
        location = manifest.get("location", "")
        parsed = urlsplit(location)
        if location and (location.startswith(("/", "file:", "sediment:"))
                         or parsed.username or parsed.password
                         or (parsed.scheme and parsed.scheme != "https")):
            raise ValueError("local or credential-bearing asset location")


def validate_budget(records: list[dict]) -> None:
    seen = set()
    for record in records:
        key = (record.get("lane"), record.get("pass"))
        if key[0] not in LANES or key[1] not in {"draft", "correction"} or key in seen:
            raise ValueError("extra or duplicated creative generation pass")
        seen.add(key)
    for lane, phase in seen:
        if phase == "correction" and (lane, "draft") not in seen:
            raise ValueError("correction has no recorded draft")


def artifact_key(source_sha256: str, settings_sha256: str, lane: str,
                 pass_name: str, panel_id: str) -> str:
    if lane not in LANES or pass_name not in {"draft", "correction"} or panel_id not in {"P01", "P02", "P03", "P04", "P05"}:
        raise ValueError("invalid lane, pass or panel")
    value = "\n".join((source_sha256, settings_sha256, lane, pass_name, panel_id))
    return hashlib.sha256(value.encode("utf-8")).hexdigest()
