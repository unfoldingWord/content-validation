/* eslint-env jest */

import { checkBookPackage } from '../core/book-package-check';
import Path from "path";
import fs from 'fs-extra';

let testFiles = {};

const optionalCheckingOptions = {
  getFile: params => {
    const { username, repository, path } = params;
    const filePath = Path.join('./src/__tests__/fixtures', username, repository, path);

    if (testFiles.hasOwnProperty(filePath)) { // see if we have a test file to use
      if (testFiles[filePath] !== null) {  // if file content not null, then return contents.  Otherwise will throw exception
        return testFiles[filePath];
      }
      // eslint-disable-next-line no-throw-literal
      throw `Simulated error - Could not find ${filePath}`;
    } else if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString();
    }
    // eslint-disable-next-line no-throw-literal
    throw `Could not find ${filePath}`;
  },
  getFilelistFromZip: params => {
    const { username, repository, optionalPrefix } = params;
    const filePath = Path.join('./src/__tests__/fixtures', username, repository);
    let files = getAllFiles(filePath);
    if (optionalPrefix) {
      files = files.filter(file => file.toLowerCase().startsWith(optionalPrefix)); // filter just for current book
    }
    return files;
  }
}

describe('checkBookPackage() - ', () => {
  beforeEach(() => {
    testFiles = {}; // reset test files
  });

  it('tit should fail on unsupported language', async() => {
    const username = 'unfoldingWord';
    const languageCode = 'zzz';
    const bookID = 'tit';
    const rawResults = await checkBookPackage(username, languageCode, bookID, () => {}, optionalCheckingOptions);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  });

  it('tit should fail on missing repo', async() => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'tit';
    testFiles = { // override these files
      'src/__tests__/fixtures/unfoldingWord/en_ult/57-TIT.usfm': null,
    };

    const rawResults = await checkBookPackage(username, languageCode, bookID, () => {}, optionalCheckingOptions);
    expect(rawResults.noticeList.length).toBeGreaterThan(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  });

  it('tit should pass', async() => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'tit';
    const rawResults = await checkBookPackage(username, languageCode, bookID, () => {}, optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(0);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  });

  it('rut should pass', async() => {
    const username = 'unfoldingWord';
    const languageCode = 'en';
    const bookID = 'rut';
    const rawResults = await checkBookPackage(username, languageCode, bookID, () => {}, optionalCheckingOptions);
    expect(rawResults.noticeList.length).toEqual(4);
    const filteredResults = {
      successList: rawResults.successList,
      noticeList: rawResults.noticeList,
      checkedFilenames: rawResults.checkedFilenames,
      checkedRepoNames: rawResults.checkedRepoNames,
    };
    expect(filteredResults).toMatchSnapshot();
  });

})

//
// Helper functions
//

/**
 * recursively get a file list
 * @param {string} dirPath
 * @param {string} subPath
 * @param {Array} arrayOfFiles
 * @return {Array}
 */
const getAllFiles = function(dirPath, subPath, arrayOfFiles) {
  arrayOfFiles = arrayOfFiles || [];
  subPath = subPath || '.';
  const fullPath = Path.join(dirPath, subPath);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);

    files.forEach(function (file) {
      const fullSubPath_ = Path.join(fullPath, file);
      if (fs.statSync(fullSubPath_).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath, Path.join(subPath, file), arrayOfFiles);
      } else {
        arrayOfFiles.push(Path.join(subPath, file));
      }
    })
  }
  return arrayOfFiles
}
