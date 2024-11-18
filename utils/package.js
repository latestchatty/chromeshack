import { access } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { glob } from "glob";

function getCurrentTimestamp() {
  const date = new Date();
  // Format the date and time in the MMDDYY_HHMMSS format
  return (
    // biome-ignore lint/style/useTemplate: reason
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0") +
    (date.getFullYear() % 100).toString().padStart(2, "0") +
    "_" +
    date.getHours().toString().padStart(2, "0") +
    date.getMinutes().toString().padStart(2, "0") +
    date.getSeconds().toString().padStart(2, "0")
  );
}

async function rmDir(dir) {
  try {
    access(dir, fs.constants.F_OK, (err) => {
      if (err) {
        console.log(`${dir} does not exist`);
      } else {
        fs.rm(dir, { recursive: true, force: true }, (err) => {
          if (err) {
            console.error(`Error removing ${dir}: ${err.message}`);
          } else {
            console.log(`Removed ${dir}`);
          }
        });
      }
    });
  } catch (err) {
    console.error(`Error removing ${dir}: ${err.message}`);
  }
}
async function cpDir(srcDir, destDir) {
  try {
    const srcPath = path.resolve(srcDir);
    const destPath = path.resolve(destDir);
    await fs.mkdir(destPath, { recursive: true, force: true });
    const items = await fs.readdir(srcPath);

    for (const item of items) {
      const srcItem = path.join(srcPath, item);
      const destItem = path.join(destPath, item);
      const stats = await fs.stat(srcItem);

      if (stats.isDirectory()) {
        await cpDir(srcItem, destItem);
      } else if (stats.isFile()) {
        await fs.copyFile(srcItem, destItem);
      }
    }
  } catch (err) {
    console.error(`Error copying ${srcDir}: ${err.message}`);
  }
}

async function createZipArchive(outputName, sourceDir, outputDir) {
  try {
    const zip = new AdmZip();
    const timestamp = getCurrentTimestamp();
    const outputFile = path.resolve(outputDir, `${outputName}-${timestamp}.zip`);
    zip.addLocalFolder(sourceDir);
    zip.writeZip(outputFile);
    console.log(`Created ${outputDir}/${outputName} successfully`);
  } catch (e) {
    console.log(`Something went wrong. ${e}`);
  }
}

async function buildSrcArchive(includes, tempDir, excludes) {
  await rmDir(tempDir);
  await fs.mkdir(path.resolve(tempDir), { recursive: true, force: true });

  for (const src of includes) {
    const files = glob.sync(src, { ignore: excludes });
    for (const file of files) {
      const dest = path.join(tempDir, path.basename(file));
      const stats = await fs.stat(file);
      if (stats.isDirectory()) {
        await cpDir(file, dest);
      } else if (stats.isFile()) {
        await fs.copyFile(file, dest);
      }
    }
  }

  // cleanup after ourselves
  await rmDir(tempDir);
}

(async () => {
  await createZipArchive("chromeshack-chrome", "./dist", "./artifacts");
  await createZipArchive("chromeshack-firefox", "./dist-firefox", "./artifacts");

  // compile an archive with source code able to reproduce the preceeding artifacts
  await buildSrcArchive(
    ["./*.md", "./*.json", "./pnpm-lock.yaml", "./*.config.ts", "./src", "./utils", "./public"],
    "./artifacts/srctemp",
    "_shack_li_.json",
  );
  await createZipArchive("chromeshack-src", "./artifacts/srctemp", "./artifacts");
})();
