const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Absolute paths to the source and destination files.
const sourcePath = 'c:\\Code\\IndependentWebSites\\VehicleSuppliesWebSite\\db\\main\\postgresql\\temp_show_message_translations.sql';
const destPath = 'c:\\Code\\IndependentWebSites\\VehicleSuppliesWebSite\\db\\main\\postgresql\\insert_message_translations_postgresql.sql';

// This regex captures the translation code and language from a line in the SQL file.
const keyRegex = /\(gen_random_uuid\(\),\s*('[^']+'|"[^"]+"),\s*('[^']+'|"[^"]+"),/;

async function mergeTranslations() {
    try {
        // Step 1: Read the large destination file line by line to build a set of existing translation keys.
        const existingKeys = new Set();
        const fileStream = fs.createReadStream(destPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            const match = line.match(keyRegex);
            if (match && match[1] && match[2]) {
                const key = `${match[1]}-${match[2]}`;
                existingKeys.add(key);
            }
        }

        // Step 2: Read the source file to find translations that are not already in the destination file.
        const sourceContent = fs.readFileSync(sourcePath, 'utf8');
        const linesToAdd = [];
        const sourceLines = sourceContent.split(/\r?\n/);

        for (const line of sourceLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith('(gen_random_uuid()')) {
                continue;
            }

            const match = line.match(keyRegex);
            if (match && match[1] && match[2]) {
                const key = `${match[1]}-${match[2]}`;
                if (!existingKeys.has(key)) {
                    const valueTuple = trimmedLine.replace(/,$/, '').replace(/;$/, '');
                    linesToAdd.push(valueTuple);
                    existingKeys.add(key);
                }
            }
        }

        // Step 3: Append the new, unique translations to the destination file.
        if (linesToAdd.length > 0) {
            const destContent = fs.readFileSync(destPath, 'utf8').trim();
            let newContent = '';

            if (destContent.endsWith(';')) {
                newContent = `\n\n-- Translations added by merge script on ${new Date().toISOString()}\n`;
                newContent += 'INSERT INTO language_translations (guid, code, lang, value) VALUES\n';
                newContent += linesToAdd.join(',\n') + ';';
            } else {
                const separator = destContent.endsWith(',') ? '\n' : ',\n';
                newContent = separator + linesToAdd.join(',\n') + ';';
            }

            fs.appendFileSync(destPath, newContent);
            console.log(`Successfully merged ${linesToAdd.length} new translation(s) into ${path.basename(destPath)}.`);
        } else {
            console.log('No new translations to add. The destination file is already up-to-date.');
        }

    } catch (error) {
        console.error('An error occurred during the merge process:', error);
    }
}

mergeTranslations();