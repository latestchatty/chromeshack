import AdmZip from 'adm-zip';
import { resolve } from 'path';

function getCurrentTimestamp() {
  const date = new Date();
  // Format the date and time in the MMDDYY_HHMMSS format
  return (date.getMonth() + 1).toString().padStart(2, '0')
  + date.getDate().toString().padStart(2, '0')
  + (date.getFullYear() % 100).toString().padStart(2, '0')
  + '_'
  + date.getHours().toString().padStart(2, '0')
  + date.getMinutes().toString().padStart(2, '0')
  + date.getSeconds().toString().padStart(2, '0');
}

async function createZipArchive(outputName, sourceDir, outputDir) {
  try {
    const zip = new AdmZip();
    const timestamp = getCurrentTimestamp();
    const outputFile = resolve(outputDir, `${outputName}-${timestamp}.zip`);
    zip.addLocalFolder(sourceDir);
    zip.writeZip(outputFile);
    console.log(`Created ${outputDir}/${outputName} successfully`);
  } catch (e) {
    console.log(`Something went wrong. ${e}`);
  }
}

createZipArchive("chromeshack-chrome", "./dist-chrome", "./artifacts");
createZipArchive("chromeshack-firefox", "./dist-firefox", "./artifacts");
