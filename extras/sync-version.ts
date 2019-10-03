import NpmPackageHelper from '@lenne.tech/npm-package-helper';
import { join } from 'path';

// Sync version of package.json and package-lock.json
const run = () => {
  // Init
  const nph = NpmPackageHelper;
  const dir = process.cwd();

  // Set highest version
  nph
    .setHighestVersion([nph.getFileData(join(dir, 'package-lock.json')), nph.getFileData(join(dir, 'package.json'))])
    .then((version) => {
      // Log version
      console.log(version);
    });
};
run();
