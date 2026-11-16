"""python3 -m unittest discover -s kit/tests -p 'test_cancello.py'"""
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(os.environ.get('CARTOON_TEST_ROOT', Path(__file__).resolve().parents[2]))
spec = importlib.util.spec_from_file_location('film_disegnato', ROOT / 'kit/engine/film_disegnato.py')
film = importlib.util.module_from_spec(spec)
spec.loader.exec_module(film)

class CancelloTest(unittest.TestCase):
    def run_gate(self, code=None, cat='MONDO', env=None):
        with tempfile.TemporaryDirectory() as tmp:
            work = Path(tmp)
            warnings = [] if code is None else [dict(cat=cat, codice=code, scena=0, t=0, testo='prova')]
            (work / 'avvisi.json').write_text(json.dumps(dict(n_scene=1, scene={'0':dict(avvisi=warnings, fotogrammi=1)})))
            with patch.dict(os.environ, env or {}, clear=True), patch.object(film.shutil, 'which', return_value='/usr/bin/node'), patch.object(film.subprocess, 'run') as run, contextlib.redirect_stdout(io.StringIO()):
                run.return_value.returncode=0
                run.return_value.stdout=''
                run.return_value.stderr=''
                return film.cancello(work/'storia.json',work)

    def test_mondo_non_aggirabile(self):
        for code in ('MONDO_POVERO','VITA_BASSA','COMPENETRATI','FUORI_POSTO','COLLOCAZIONE_ERRORE'):
            for env in ({},{'CONTROLLI_OK':'1'},{'MONDO_OK':'1'},{'CONTROLLI_OK':'1','MONDO_OK':'1'}):
                with self.subTest(code=code, env=env), self.assertRaises(SystemExit):
                    self.run_gate(code, env=env)

    def test_messaggio_guida_costruzione(self):
        with self.assertRaises(SystemExit) as cm:
            self.run_gate('MONDO_POVERO')
        for term in ('GLB gratuiti','licenza','dettagli','library/'):
            self.assertIn(term,str(cm.exception))

    def test_messaggio_geometria_distinto(self):
        with self.assertRaises(SystemExit) as cm:
            self.run_gate('COMPENETRATI')
        self.assertIn('separa gli oggetti',str(cm.exception))
        self.assertNotIn('GLB gratuiti',str(cm.exception))

    def test_altri_controlli(self):
        with self.assertRaises(SystemExit):
            self.run_gate('SOGGETTO_FUORI','INQUADRATURA')
        self.assertEqual(len(self.run_gate('SOGGETTO_FUORI','INQUADRATURA',{'CONTROLLI_OK':'1'})[0]),1)
        self.assertEqual(self.run_gate(),([],[],[]))

if __name__ == '__main__': unittest.main()
