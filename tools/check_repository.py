"""Verify frozen text, source coverage, engine and published comparison hashes."""
import hashlib
import json
from pathlib import Path

from bench_contract import validate_budget, validate_manifest

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return json.loads((ROOT / path).read_text())


def checked_file(relative, expected):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError('missing file or escaping path: ' + relative)
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError('hash mismatch: ' + relative)


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
        validate_budget(results['runs'])
        if len(results['runs']) != results['creative_launch_count'] or len(results['panels']) != 20:
            raise ValueError('comparison launch or scene-slot count mismatch')
        slots = {(p['lane'], p['scene_id']) for p in results['panels']}
        if slots != {(lane, panel) for lane in ('sol', 'astra', 'opus', 'fable')
                     for panel in ('P01', 'P02', 'P03', 'P04', 'P05')}:
            raise ValueError('comparison has duplicate or missing model/scene slots')
        for asset in load(comparison + 'assets.json')['assets']:
            validate_manifest(asset, public=True)
            checked_file(asset['path'], asset['sha256'])
        reviewed = [p for p in results['panels'] if p['status'] == 'reviewed']
        if len(reviewed) != results['reviewed_panels']:
            raise ValueError('reviewed-image count mismatch')
        for panel in reviewed:
            run = next(r for r in results['runs'] if r['lane'] == panel['lane']
                       and r['pass'] == panel['selected_pass'])
            if (not run['completed'] or run['verified_model'] != panel['model']
                    or run['source_sha256'] != panel['source_sha256']):
                raise ValueError('image is not tied to its completed model/source')
            checked_file(panel['preview'], panel['preview_sha256'])
        if results['complete_four_model_comparison'] != (len(reviewed) == 20 and all(p['eligible'] for p in reviewed)):
            raise ValueError('unsupported four-model completion claim')
    print('Frozen chapters, source coverage, runtime and available comparison manifests verified.')


if __name__ == '__main__':
    main()
