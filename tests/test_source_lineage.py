"""Substitution checks for the published source, independent of file manifests."""
import hashlib,json,sys,tempfile,unittest
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import check_repository


class PublishedSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.original_root=check_repository.ROOT
        check_repository.ROOT=Path(self.temp.name).resolve()
        self.comparison='comparisons/example/'
        self.directory=self.comparison+'source/sol/draft/'
        self.source={'src/lib/palette.js':'const colour="é";\n',
                     'src/lib/cast.js':'function adultCast() {}\n',
                     'src/scenes/panels.js':'// exact source\n'}
        digest=hashlib.sha256(json.dumps(self.source,sort_keys=True,ensure_ascii=False).encode()).hexdigest()
        self.run={'call_id':'original-sol-draft','lane':'sol','pass':'draft','verified_model':'gpt-6.1-sol',
                  'source_sha256':digest,'source_bytes':sum(len(v.encode()) for v in self.source.values())}
        files=[]
        for relative,content in self.source.items():
            path=check_repository.ROOT/(self.directory+relative);path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(content.encode())
            files.append({'path':self.directory+relative,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
        self.manifest={'files':files,'author_call_id':self.run['call_id'],'author_model':self.run['verified_model'],
                       'pass':'draft','source_was_modified':False,'source_sha256':digest}
        self.save_manifest()

    def tearDown(self):
        check_repository.ROOT=self.original_root;self.temp.cleanup()

    def save_manifest(self):
        (check_repository.ROOT/(self.directory+'manifest.json')).write_text(json.dumps(self.manifest))

    def test_exact_utf8_package_is_bound_to_author_call(self):
        check_repository.checked_source_package(self.comparison,self.run)

    def test_rehashed_replacement_file_cannot_change_author_package(self):
        item=self.manifest['files'][0];path=check_repository.ROOT/item['path']
        path.write_bytes(b'const replacement=true;\n');item['sha256']=hashlib.sha256(path.read_bytes()).hexdigest();self.save_manifest()
        with self.assertRaises(ValueError):check_repository.checked_source_package(self.comparison,self.run)

    def test_manifest_cannot_reassign_source_to_another_recovery_call(self):
        self.manifest['author_call_id']='different-call';self.save_manifest()
        with self.assertRaises(ValueError):check_repository.checked_source_package(self.comparison,self.run)

    def test_manifest_cannot_import_another_lane_file(self):
        self.manifest['files'][0]['path']=self.manifest['files'][0]['path'].replace('/sol/','/astra/');self.save_manifest()
        with self.assertRaises(ValueError):check_repository.checked_source_package(self.comparison,self.run)


if __name__=='__main__':unittest.main()
