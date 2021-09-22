# DocXtractorConnect
Ein kleine NodeJS Skript für die Weitergabe von PDFs an den DocXtractor.


### Ablauf
- Überwacht den Ordner `scanin` bis neue Dateien kommen
- Arbeiten den Ordner beim Start einmal ab
- PDF Dateien werden so verarbeitet, dass der DocXtractor diese übernimmt.


#### Vorher
```
.
└── Scanin
    └── Scan.pdf
```

#### Nachher
```
.
└── Exchange
    ├── 12345678
    │   ├── 12345678_file.pdf
    │   └── import.xml
    └── 12345678.sf_import_start
```