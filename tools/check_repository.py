"""Verify frozen text, source coverage, engine and published comparison hashes."""
import hashlib
import json
from pathlib import Path

from bench_contract import SOURCE_PATHS, validate_budget, validate_manifest, validate_run_history

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return json.loads((ROOT / path).read_text())


def checked_file(relative, expected):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError('missing file or escaping path: ' + relative)
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError('hash mismatch: ' + relative)


def checked_source_package(comparison, run):
    directory = comparison + 'source/' + run['lane'] + '/' + run['pass'] + '/'
    manifest = load(directory + 'manifest.json')
    files = manifest['files']
    expected = {directory + path for path in SOURCE_PATHS}
    if (len(files) != 3 or {x['path'] for x in files} != expected
            or manifest.get('author_call_id') != run['call_id']
            or manifest.get('author_model') != run['verified_model']
            or manifest.get('pass') != run['pass'] or manifest.get('source_was_modified') is not False):
        raise ValueError('published source manifest does not match its author call')
    source = {}
    for item in files:
        checked_file(item['path'], item['sha256'])
        source[item['path'][len(directory):]] = (ROOT / item['path']).read_bytes().decode('utf-8')
    digest = hashlib.sha256(json.dumps(source, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    if (digest != run['source_sha256'] or digest != manifest.get('source_sha256')
            or sum(len(v.encode('utf-8')) for v in source.values()) != run['source_bytes']):
        raise ValueError('published source bytes differ from the authored package')


def main():
    chapters = load('adaptation/chapter-manifest.json')
    if len(chapters['chapters']) != chapters['chapter_count'] or chapters['chapter_count'] != 12:
        raise ValueError('incomplete frozen adaptation')
    for chapter in chapters['chapters']:
        checked_file(chapter['public_path'], chapter['sha256'])
    index = load('source/unit-index.json')
    coverage = load('adaptation/source-coverage.json')
    ids = [unit['id'] for unit in index['units']]
    assigned = [unit for chapter in coverage['chapters'] for unit in chapter['source_unit_ids']]
    if (index['source_sha256'] != coverage['source_sha256']
            or len(ids) != index['unit_count'] or len(set(ids)) != len(ids)
            or len(assigned) != coverage['unit_count'] or len(set(assigned)) != len(assigned)
            or set(ids) != set(assigned) or len(coverage['chapters']) != 12):
        raise ValueError('missing, duplicated or mismatched source-unit coverage')
    for chapter in coverage['chapters']:
        if not (ROOT / 'adaptation/chapters' / (chapter['chapter_id'] + '.md')).is_file():
            raise ValueError('coverage references an absent chapter')
    engine = load('art/engine-provenance.json')
    for file in engine['files']:
        checked_file('art/engine/' + file['path'], file['sha256'])
    checked_file('art/' + engine['common_harness']['path'], engine['common_harness']['sha256'])
    comparison = 'comparisons/midsummer-five-panels/'
    if (ROOT / comparison / 'results.json').exists():
        results = load(comparison + 'results.json')
        if results['schema_version'] == 2:
            calls = validate_run_history(results['runs'])
            if (results['outer_call_count'] != len(calls)
                    or results['completed_creative_phase_count'] != sum(r['completed'] for r in calls.values())
                    or results['original_outer_call_count'] + results['recovery_outer_call_count'] != len(calls)):
                raise ValueError('author call/package count mismatch')
            for run in calls.values():
                if run['completed']:
                    checked_source_package(comparison, run)
        elif results['schema_version'] == 1:
            validate_budget(results['runs'])
            calls = None
            if len(results['runs']) != results['creative_launch_count']:
                raise ValueError('comparison launch count mismatch')
        else:
            raise ValueError('unsupported comparison schema')
        if len(results['panels']) != 20:
            raise ValueError('comparison launch or scene-slot count mismatch')
        slots = {(p['lane'], p['scene_id']) for p in results['panels']}
        if slots != {(lane, panel) for lane in ('sol', 'astra', 'opus', 'fable')
                     for panel in ('P01', 'P02', 'P03', 'P04', 'P05')}:
            raise ValueError('comparison has duplicate or missing model/scene slots')
        if results['schema_version'] == 2:
            labels = [p.get('blind_label') for p in results['panels']]
            if any(not isinstance(label, str) or not label for label in labels) or len(set(labels)) != 20:
                raise ValueError('comparison has duplicate or missing blind image labels')
        for asset in load(comparison + 'assets.json')['assets']:
            validate_manifest(asset, public=True)
            checked_file(asset['path'], asset['sha256'])
        reviewed = [p for p in results['panels'] if p['status'] == 'reviewed']
        if len(reviewed) != results['reviewed_panels']:
            raise ValueError('reviewed-image count mismatch')
        for panel in reviewed:
            run = calls.get(panel.get('selected_run_id')) if calls is not None else next(
                r for r in results['runs'] if r['lane'] == panel['lane'] and r['pass'] == panel['selected_pass'])
            if run is None or run['lane'] != panel['lane'] or run['pass'] != panel['selected_pass']:
                raise ValueError('image references a missing or wrong-lane author call')
            if (not run['completed'] or run['verified_model'] != panel['model']
                    or run['source_sha256'] != panel['source_sha256']):
                raise ValueError('image is not tied to its completed model/source')
            checked_file(panel['preview'], panel['preview_sha256'])
        if results['complete_four_model_comparison'] != (len(reviewed) == 20 and all(p['eligible'] for p in reviewed)):
            raise ValueError('unsupported four-model completion claim')
    print('Frozen chapters, source coverage, runtime and available comparison manifests verified.')


if __name__ == '__main__':
    main()
