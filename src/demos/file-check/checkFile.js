// import * as books from '../../core/books/books';
// import checkUSFMText from '../../core/usfm-text-check';
// import checkMarkdownText from '../../core/markdown-text-check';
// import checkPlainText from '../../core/plain-text-check';
// import checkYAMLText from '../../core/yaml-text-check';
// import checkManifestText from '../../core/manifest-text-check';
// import checkTN_TSVText from '../../core/tn-table-text-check';
// import { consoleLogObject } from '../../core/utilities';


// const CHECK_FILE_VERSION_STRING = '0.1.5';


// async function checkFileDemo(filename, fileContent, givenLocation, checkingOptions) {
//     // Determine the file type from the filename extension
//     //  and return the results of checking that kind of file
//     //     console.log(`I'm here in checkFile v${CHECK_FILE_VERSION_STRING}
//     //   with ${filename}, ${fileContent.length} chars, ${givenLocation}, ${JSON.stringify(checkingOptions)}`);
//     const startTime = new Date();

//     let ourCFLocation = givenLocation;
//     if (ourCFLocation[0] !== ' ') ourCFLocation = ' ' + ourCFLocation;

//     let checkFileResult;
//     if (filename.toLowerCase().endsWith('.tsv')) {
//         const filenameMain = filename.substring(0, filename.length - 4); // drop .tsv
//         // console.log(`Have TSV filenameMain=${filenameMain}`);
//         const bookID = filenameMain.substring(filenameMain.length - 3);
//         // console.log(`Have TSV bookcode=${bookID}`);
//         console.assert(books.isValidBookID(bookID), `checkFile: '${bookID}' is not a valid USFM book identifier`);
//         checkFileResult = await checkTN_TSVText(bookID, fileContent, ourCFLocation, checkingOptions);
//     }
//     else if (filename.toLowerCase().endsWith('.usfm')) {
//         const filenameMain = filename.substring(0, filename.length - 5); // drop .usfm
//         // console.log(`Have USFM filenameMain=${filenameMain}`);
//         const bookID = filenameMain.substring(filenameMain.length - 3);
//         // console.log(`Have USFM bookcode=${bookID}`);
//         console.assert(books.isValidBookID(bookID), `checkFile: '${bookID}' is not a valid USFM book identifier`);
//         checkFileResult = checkUSFMText(bookID, filename, fileContent, ourCFLocation, checkingOptions);
//     } else if (filename.toLowerCase().endsWith('.sfm')) {
//         const filenameMain = filename.substring(0, filename.length - 4); // drop .sfm
//         console.log(`Have SFM filenameMain=${filenameMain}`);
//         const bookID = filenameMain.substring(2, 5);
//         console.log(`Have SFM bookcode=${bookID}`);
//         console.assert(books.isValidBookID(bookID), `checkFile: '${bookID}' is not a valid USFM book identifier`);
//         checkFileResult = checkUSFMText(bookID, filename, fileContent, ourCFLocation, checkingOptions);
//     } else if (filename.toLowerCase().endsWith('.md'))
//         checkFileResult = checkMarkdownText(filename, fileContent, ourCFLocation, checkingOptions);
//     else if (filename.toLowerCase().endsWith('.txt'))
//         checkFileResult = checkPlainText(filename, fileContent, ourCFLocation, checkingOptions);
//     else if (filename.toLowerCase() === 'manifest.yaml')
//         checkFileResult = checkManifestText(filename, fileContent, ourCFLocation, checkingOptions);
//     else if (filename.toLowerCase().endsWith('.yaml'))
//         checkFileResult = checkYAMLText(filename, fileContent, ourCFLocation, checkingOptions);
//     else {
//         checkFileResult = checkPlainText(filename, fileContent, ourCFLocation, checkingOptions);
//         checkFileResult.noticeList.unshift({priority:995, message:"File extension is not recognized, so treated as plain text.", location:filename});
//     }
//     // console.log(`checkFile got initial results with ${checkFileResult.successList.length} success message(s) and ${checkFileResult.noticeList.length} notice(s)`);

//     // Add some extra fields to our checkFileResult object
//     //  in case we need this information again later
//     checkFileResult.checkedFileCount = 1;
//     checkFileResult.checkedFilename = filename;
//     checkFileResult.checkedFilesize = fileContent.length;
//     checkFileResult.checkedOptions = checkingOptions;

//     checkFileResult.elapsedSeconds = (new Date() - startTime) / 1000; // seconds
//     return checkFileResult;
// };
// // end of checkFile()

// export default checkFileDemo;
