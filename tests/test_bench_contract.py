import unittest

from tools.bench_contract import (
    artifact_key,
    validate_budget,
    validate_manifest,
    validate_package,
    validate_receipt,
)


def package():
    return {
        "schema_version": 1,
        "files": [
            {"path": "src/lib/palette.js", "content": "const COLOURS = {};"},
            {"path": "src/lib/cast.js", "content": "function adultCast() {}"},
            {"path": "src/scenes/panels.js", "content": "// five authored panels"},
        ],
    }


class PackageTests(unittest.TestCase):
    def test_valid_package_returns_exact_source_without_edits(self):
        p = package()
        self.assertEqual(validate_package(p), {x["path"]: x["content"] for x in p["files"]})

    def test_path_traversal_cannot_escape_lane(self):
        p = package()
        p["files"][0]["path"] = "../src/lib/palette.js"
        with self.assertRaises(ValueError):
            validate_package(p)

    def test_duplicate_source_path_is_rejected(self):
        p = package()
        p["files"][2]["path"] = p["files"][0]["path"]
        with self.assertRaises(ValueError):
            validate_package(p)

    def test_missing_source_is_rejected(self):
        p = package()
        p["files"].pop()
        with self.assertRaises(ValueError):
            validate_package(p)

    def test_byte_limit_counts_utf8_bytes(self):
        p = package()
        p["files"][0]["content"] = "é" * 131073
        with self.assertRaises(ValueError):
            validate_package(p)


class ReceiptTests(unittest.TestCase):
    def receipt(self):
        return {"verified_model": "gpt-6.1-sol", "evidence_kind": "session-selection",
                "evidence_source": "official new-run turn_context", "completed": True,
                "output_sha256": "a" * 64}

    def test_completed_matching_official_receipt_is_accepted(self):
        validate_receipt(self.receipt(), "gpt-6.1-sol")

    def test_launch_flag_is_not_model_evidence(self):
        r = self.receipt()
        r["evidence_kind"] = "launch-flag"
        with self.assertRaises(ValueError):
            validate_receipt(r, "gpt-6.1-sol")

    def test_wrong_model_is_rejected(self):
        with self.assertRaises(ValueError):
            validate_receipt(self.receipt(), "gpt-6-astra")

    def test_incomplete_output_is_rejected(self):
        r = self.receipt()
        r["completed"] = False
        with self.assertRaises(ValueError):
            validate_receipt(r, "gpt-6.1-sol")


class ManifestAndBudgetTests(unittest.TestCase):
    def manifest(self):
        return {"sha256": "b" * 64, "version": 1, "visibility": "public",
                "clearance_status": "cleared", "license": "CC-BY-4.0",
                "location": "https://example.org/panel.png"}

    def test_cleared_public_asset_is_accepted(self):
        validate_manifest(self.manifest(), public=True)

    def test_private_location_cannot_enter_public_manifest(self):
        m = self.manifest()
        m["local_path"] = "/private/panel.png"
        with self.assertRaises(ValueError):
            validate_manifest(m, public=True)

    def test_credential_bearing_url_is_rejected(self):
        m = self.manifest()
        m["location"] = "https://user:secret@example.org/panel.png"
        with self.assertRaises(ValueError):
            validate_manifest(m, public=True)

    def test_extra_authored_pass_is_rejected(self):
        r = [{"lane": "sol", "pass": p} for p in ("draft", "correction", "extra")]
        with self.assertRaises(ValueError):
            validate_budget(r)

    def test_draft_and_one_correction_per_lane_are_accepted(self):
        validate_budget([{"lane": lane, "pass": p} for lane in ("sol", "astra", "opus", "fable")
                         for p in ("draft", "correction")])

    def test_each_panel_source_settings_and_pass_has_own_namespace(self):
        values = [artifact_key("a" * 64, "b" * 64, "sol", "draft", f"P0{i}")
                  for i in range(1, 6)]
        values += [artifact_key("c" * 64, "b" * 64, "sol", "draft", "P01"),
                   artifact_key("a" * 64, "c" * 64, "sol", "draft", "P01"),
                   artifact_key("a" * 64, "b" * 64, "sol", "correction", "P01")]
        self.assertEqual(len(values), len(set(values)))


if __name__ == "__main__":
    unittest.main()
