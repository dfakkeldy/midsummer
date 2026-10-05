import unittest

from tools.bench_contract import (
    artifact_key,
    validate_budget,
    validate_manifest,
    validate_package,
    validate_receipt,
    validate_alignment,
    validate_run_history,
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

    def test_nested_private_metadata_cannot_be_published(self):
        m = self.manifest()
        m['provenance'] = {'raw_receipt': {'account_id': 'private'}}
        with self.assertRaises(ValueError):
            validate_manifest(m, public=True)

    def test_signed_storage_url_cannot_be_published(self):
        m = self.manifest()
        m['location'] = 'https://example.org/panel.png?X-Amz-Signature=secret'
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


class AlignmentTests(unittest.TestCase):
    def record(self):
        return {'panel_id':'P01','chapter_id':'ch01','source_unit_ids':['a1s1u1'],
                'exact_text_anchor':'Accepted sentence.', 'epub_sha256':'a'*64,
                'narration_sha256':'b'*64,'alignment_unit_ids':['block-1'],
                'start_seconds':1.0,'end_seconds':2.0,'verified':True}

    def test_verified_matching_alignment_is_accepted(self):
        validate_alignment(self.record())

    def test_unverified_future_record_allows_missing_timing(self):
        r = self.record()
        r.update(verified=False, start_seconds=None, end_seconds=None,
                 epub_sha256=None, narration_sha256=None, alignment_unit_ids=[])
        validate_alignment(r)

    def test_verification_requires_both_editions_and_real_alignment_ids(self):
        for field in ('epub_sha256','narration_sha256','alignment_unit_ids'):
            r = self.record(); r[field] = None
            with self.subTest(field=field), self.assertRaises(ValueError):
                validate_alignment(r)

    def test_invalid_or_nonfinite_timing_cannot_be_verified(self):
        for start,end in ((2,1),(-1,2),(1,1),(0,float('nan'))):
            r = self.record(); r.update(start_seconds=start,end_seconds=end)
            with self.subTest(start=start,end=end), self.assertRaises(ValueError):
                validate_alignment(r)


class RecoveryHistoryTests(unittest.TestCase):
    def call(self, call_id, phase='draft', completed=True):
        return {'call_id':call_id, 'lane':'sol', 'pass':phase,
                'requested_model':'gpt-6.1-sol', 'completed':completed,
                'verified_model':'gpt-6.1-sol' if completed else None,
                'evidence_kind':'session-selection' if completed else None,
                'evidence_source':'official saved-session model' if completed else None,
                'status':'verified-package' if completed else 'no-completed-package',
                'output_sha256':'a'*64 if completed else None,
                'source_sha256':'b'*64 if completed else None,
                'source_bytes':100 if completed else None}

    def test_interrupted_calls_do_not_consume_additional_creative_phases(self):
        history=[self.call('initial-draft'), self.call('interrupted-correction','correction',False),
                 self.call('guard-false-positive','correction',False), self.call('resumed-correction','correction')]
        self.assertEqual(len(validate_run_history(history)),4)

    def test_second_completed_package_in_same_phase_is_rejected(self):
        with self.assertRaises(ValueError):
            validate_run_history([self.call('initial-draft'),self.call('second-draft')])

    def test_duplicate_call_id_is_rejected(self):
        with self.assertRaises(ValueError):
            validate_run_history([self.call('draft'),self.call('draft','correction')])

    def test_completed_correction_requires_completed_initial(self):
        with self.assertRaises(ValueError):
            validate_run_history([self.call('failed-draft',completed=False),self.call('correction','correction')])

    def test_retry_cannot_substitute_requested_model(self):
        r=self.call('retry',completed=False);r['requested_model']='gpt-6-astra'
        with self.assertRaises(ValueError):
            validate_run_history([r])

    def test_unfinished_call_cannot_verify_source(self):
        r=self.call('unfinished',completed=False);r['source_sha256']='b'*64
        with self.assertRaises(ValueError):
            validate_run_history([r])

    def test_completed_call_requires_real_source_size_and_receipt(self):
        for field,value in [('source_bytes',True),('source_bytes',262145),('source_sha256','invalid'),
                            ('status','no-completed-package'),('evidence_kind','launch-flag')]:
            r=self.call('draft');r[field]=value
            with self.subTest(field=field,value=value),self.assertRaises(ValueError):
                validate_run_history([r])

if __name__ == "__main__":
    unittest.main()
