const fs = require('fs');

module.exports = {

    counter: 0,

    path: {
        scanin: "./scanin",
        exchange: "C:/DocXtractorII_50/Invoice/Exchange",
        export: "./export",
    },

    start() {

        console.log();
        console.log('😎 \x1b[33mDocXtractor Scanner Connect\x1b[0m');
        console.log('   ├── Version 1.0');
        console.log('   └── by Tobias Pitzer / Bürosystemhaus Schäfer GmbH & Co. KG');
        console.log();


        // Read Counter


        var me = this;

        // Überwachung starten
        me.all(function () {
            me.watch();
        });
    },

    all(cb) {

        console.log('> Process all Files');

        me = this;

        me.allScanin(function () {



            cb();
        })

        var i = 0;


    },

    allScanin(cb) {

        me = this;

        console.log('> Process Scan In');

        var i = 0;
        // Alle Dateien Scannen
        fs.readdir(me.path.scanin, (err, files) => {
            files.forEach(file => {
                me.processScan(file);

                i++;
            });

            if (i == 0) {
                console.log('> No Files to Process');
            }

            cb();

        });
    },

    processScan(file) {

        var me = this;

        console.log();
        console.log('⚡ Process >' + file + '<');

        try {

            var extension = file.split('.').pop();

            // Prüfen das es eine Datei und ein PDF ist
            if (extension.toLowerCase() == 'pdf') {
                
                console.log('   ├── File is PDF');

                // Prüfen, dass der File bereit ist
                me.checkFileReady(me.path.scanin + "/" + file , function(isReady) {

                    if(isReady) {

                        // Stack ID vergeben
                        var stack = me.getUniqueStackId();

                        var fileDir = me.path.exchange + '/' + stack;

                        console.log('   ├── Create Directory >' + stack + '< in Exchange');

                        // Create Dir in 
                        fs.mkdirSync(fileDir);

                        console.log('   ├── Move PDF to Exchange Folder');

                        // Move File There
                        fs.renameSync(me.path.scanin + "/" + file, me.path.exchange + '/' + stack + "/" + file);

                        console.log('   ├── Create import.xml');

                        var xml = me.getXmlMarkup(file, stack);
                        
                        fs.writeFileSync(me.path.exchange + '/' + stack + "/import.xml", xml);

                        console.log('   ├── Write DocX Command File');

                        fs.writeFileSync(me.path.exchange + '/' + stack + ".sf_import_start", "");

                        console.log('   └── Finished');  
                    } else {
                        console.log('   └── File has been deleted');  
                    }

                });


            } else {
                console.log('   └── File is no PDF, will be deleted');
                fs.unlinkSync(me.path.scanin + "/" + file);
            }

        } catch (ex) {
            console.log(ex);
        }
    },
	
    checkFileReady(path, callback) {
        
        var me = this;

        console.log('   ├── Waiting for File to be Complete');

        // Prüfen ob die Datei Lesbar ist
        fs.open(path, 'r+', function(err, fd) {
            
            // Wenn die Datei noch in Bearbeitung ist
            if (err && err.code === 'EBUSY'){
                setTimeout(function() {
                    me.checkFileReady(path, callback);
                },500);

            // Wenn die Datei gelöscht wurde
            } else if (err && err.code === 'ENOENT'){
                callback(false);
            // Wenn die Datei verfügbar ist
            } else {
                fs.close(fd, function() {
                    callback(true);
                });
            }
        });
    },

    getXmlMarkup(filename, stack) {

        var xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
            '<!DOCTYPE STACK SYSTEM "System\\Config\\DTD\\sfx_import.dtd">\n' +
            '<STACK Category="Invoice" LocationType="File" Priority="5" StackID="' + stack + '" SubSystem="Invoice">\n' +
            '\t<ATTRIBUTES>\n' +
            '\t\t<KeyValuePair Key="$UserName" Value="Tobias Pitzer"/>\n' +
            '\t\t<KeyValuePair Key="$ArchivId" Value="(6B0C8265-9B16-AA09-65E7-D0B5AB9C988D)"/>\n' +
            '\t\t<KeyValuePair Key="$ArchivDocId" Value="61315"/>\n' +
            '\t</ATTRIBUTES>\n' +
            '\t<IMAGE DoID="0000" ImageID="0" Skipped="FALSE" LocationID="' + filename + '"/>\n' +
            '</STACK>';
            
        return xml;
    },

    getUniqueStackId() {

        var me = this;

        // Hochzählen
        me.counter++;

        return Date.now() + me.counter;
    },

    // Watch
    watch() {

        var me = this;

        console.log();
        console.log('> ⏰ Start Watch');

        fs.watch(me.path.scanin, (eventType, filename) => {
            if (eventType == 'rename' && me.isFile(me.path.scanin + "/" + filename)) {
                console.log('📂 Scanin');
                me.processScan(filename);
            }
        });

        fs.watch(me.path.exchange, (eventType, filename) => {

            if (eventType == 'rename') {

                var ext = filename.split(".").pop().toLowerCase();            

                if(ext == 'sf_export_finished' && me.isFile(me.path.exchange + "/" + filename)) {
                    console.log('📂 Export Finished');
                }
            }
        });
    },

    isFile(path) {
        return fs.existsSync(path) && fs.lstatSync(path).isFile();
    }
}