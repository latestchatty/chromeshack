import licenseChecker from 'license-checker';
import fs from 'fs';
import path from 'path';

licenseChecker.init({ start: './', json: true }, function (err, packages) {
  if (err) {
    console.error(err);
    return;
  }

  let licenses = '';
  for (const packageName in packages) {
    const packageInfo = packages[packageName];

    if (packageInfo && packageInfo.licenseFile) {
      licenses += `Package: ${packageName}\n`;
      licenses += `License: ${packageInfo.licenses}\n`;

      try {
        const licenseContent = fs.readFileSync(path.resolve(packageInfo.licenseFile), 'utf8');
        licenses += `\n${licenseContent}\n`;
      } catch (error) {
        console.error(`Error reading license file for ${packageName}: ${error.message}`);
      }
      licenses += '\n';
    }
  }

  const outPath = path.join('./public/ThirdPartyLicenses.txt');
  fs.writeFileSync(outPath, licenses);

  console.log('ThirdPartyLicenses.txt file generated successfully!');
});
