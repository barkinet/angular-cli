import {normalize} from 'path';

import {createProjectFromAsset} from '../../../utils/assets';
import {exec, execWithEnv} from '../../../utils/process';
import {updateJsonFile} from '../../../utils/project';
import {expectFileSizeToBeUnder, expectFileToExist, expectFileToMatch} from '../../../utils/fs';
import {expectToFail} from '../../../utils/utils';


export default function(skipCleaning: () => void) {
  return Promise.resolve()
    .then(() => createProjectFromAsset('webpack/test-app-weird'))
    .then(() => exec(normalize('node_modules/.bin/webpack'), '-p'))
    .then(() => expectFileToExist('dist/app.main.js'))
    .then(() => expectFileToExist('dist/0.app.main.js'))
    .then(() => expectFileToExist('dist/1.app.main.js'))
    .then(() => expectFileToExist('dist/2.app.main.js'))
    .then(() => expectFileSizeToBeUnder('dist/app.main.js', 410000))
    .then(() => expectFileSizeToBeUnder('dist/0.app.main.js', 40000))

    // Verify that we're using the production environment.
    .then(() => expectFileToMatch('dist/app.main.js', /PRODUCTION_ONLY/))
    .then(() => expectToFail(() => expectFileToMatch('dist/app.main.js', /DEBUG_ONLY/)))

    // Skip code generation and rebuild.
    .then(() => updateJsonFile('aotplugin.config.json', json => {
      json['skipCodeGeneration'] = true;
    }))
    .then(() => updateJsonFile('webpack.flags.json', json => {
      json['DEBUG'] = true;
    }))
    .then(() => exec(normalize('node_modules/.bin/webpack'), '-p'))
    .then(() => expectFileToExist('dist/app.main.js'))
    .then(() => expectFileToExist('dist/0.app.main.js'))
    .then(() => expectFileToExist('dist/1.app.main.js'))
    .then(() => expectFileToExist('dist/2.app.main.js'))
    .then(() => expectToFail(() => expectFileSizeToBeUnder('dist/app.main.js', 410000)))
    .then(() => expectFileSizeToBeUnder('dist/0.app.main.js', 40000))

    // Verify that we're using the debug environment now.
    .then(() => expectFileToMatch('dist/app.main.js', /DEBUG_ONLY/))
    .then(() => expectToFail(() => expectFileToMatch('dist/app.main.js', /PRODUCTION_ONLY/)))

    .then(() => skipCleaning());
}
