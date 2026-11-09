# Motore per «La notte in cui il mondo non finì»

- `petrov_1983.json`: file della storia per la skill cartoon-storie (78 battute, 10 luoghi). Va in `kit/stories/`.
- `petrov.py` + `places.py`: generano il JSON (luoghi, cast, regia). I percorsi di voce e parole puntano a `work/`.
- Asset essenziali (173 MB invece di 3 GB): `asset_scelti.txt` = 51 modelli; texture `concrete_floor_painted, painted_plaster_wall, wood_floor, asphalt_02, grass_ground, marble_tiles`; cieli `kiara_interior, moonlit_golf, belfast_sunset_puresky, kloofendal_48d_partly_cloudy_puresky`.
- `prendi.py` scarica solo quei file dalla release v1 con richieste HTTP Range (serve prima `rzip.py <url zip> kitdl/<zip>.list.json` per leggere l'indice di ogni zip):
  `python prendi.py "$(cat asset_scelti.txt)" "<texture>" "<cieli>"` → `asset-kit/` accanto alla skill.
