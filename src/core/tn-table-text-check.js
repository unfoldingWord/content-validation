import * as books from './books/books';
import { DEFAULT_EXTRACT_LENGTH } from './text-handling-functions'
import { checkTN_TSVDataRow } from './tn-table-row-check';
import { removeDisabledNotices } from './disabled-notices';


const TN_TABLE_TEXT_VALIDATOR_VERSION_STRING = '0.3.0';

const NUM_EXPECTED_TN_TSV_FIELDS = 9; // so expects 8 tabs per line
const EXPECTED_TN_HEADING_LINE = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote';


export async function checkTN_TSVText(languageCode, bookID, filename, tableText, givenLocation, checkingOptions) {
    /* This function is optimised for checking the entire file, i.e., all rows.

      It also has the advantage of being able to compare one row with the previous one.

     bookID is a three-character UPPERCASE USFM book identifier or 'OBS'.

     Returns a result object containing a successList and a noticeList
     */
    // console.log(`checkTN_TSVText(${bookID}, ${tableText.length}, ${location},${JSON.stringify(checkingOptions)})…`);
    console.assert(languageCode !== undefined, "checkTN_TSVText: 'languageCode' parameter should be defined");
    console.assert(typeof languageCode === 'string', `checkTN_TSVText: 'languageCode' parameter should be a string not a '${typeof languageCode}'`);
    console.assert(bookID !== undefined, "checkTN_TSVText: 'bookID' parameter should be defined");
    console.assert(typeof bookID === 'string', `checkTN_TSVText: 'bookID' parameter should be a string not a '${typeof bookID}'`);
    console.assert(bookID.length === 3, `checkTN_TSVText: 'bookID' parameter should be three characters long not ${bookID.length}`);
    console.assert(bookID.toUpperCase() === bookID, `checkTN_TSVText: 'bookID' parameter should be UPPERCASE not '${bookID}'`);
    console.assert(books.isValidBookID(bookID), `checkTN_TSVText: '${bookID}' is not a valid USFM book identifier`);
    console.assert(givenLocation !== undefined, "checkTN_TSVText: 'givenLocation' parameter should be defined");
    console.assert(typeof givenLocation === 'string', `checkTN_TSVText: 'givenLocation' parameter should be a string not a '${typeof givenLocation}'`);
    console.assert(checkingOptions !== undefined, "checkTN_TSVText: 'checkingOptions' parameter should be defined");

    let ourLocation = givenLocation;
    if (ourLocation && ourLocation[0] !== ' ') ourLocation = ` ${ourLocation}`;

    const ttResult = { successList: [], noticeList: [] };

    function addSuccessMessage(successString) {
        // console.log(`checkTN_TSVText success: ${successString}`);
        ttResult.successList.push(successString);
    }
    function addNoticePartial(noticeObject) {
        // console.log(`checkTN_TSVText notice: (priority=${priority}) ${message}${characterIndex > 0 ? ` (at character ${characterIndex})` : ""}${extract ? ` ${extract}` : ""}${location}`);
        console.assert(noticeObject.priority !== undefined, "TSV addNoticePartial: 'priority' parameter should be defined");
        console.assert(typeof noticeObject.priority === 'number', `TSV addNoticePartial: 'priority' parameter should be a number not a '${typeof noticeObject.priority}': ${noticeObject.priority}`);
        console.assert(noticeObject.message !== undefined, "TSV addNoticePartial: 'message' parameter should be defined");
        console.assert(typeof noticeObject.message === 'string', `TSV addNoticePartial: 'message' parameter should be a string not a '${typeof noticeObject.message}': ${noticeObject.message}`);
        // console.assert(C !== undefined, "TSV addNoticePartial: 'C' parameter should be defined");
        if (noticeObject.C) console.assert(typeof noticeObject.C === 'string', `TSV addNoticePartial: 'C' parameter should be a string not a '${typeof noticeObject.C}': ${noticeObject.C}`);
        // console.assert(V !== undefined, "TSV addNoticePartial: 'V' parameter should be defined");
        if (noticeObject.V) console.assert(typeof noticeObject.V === 'string', `TSV addNoticePartial: 'V' parameter should be a string not a '${typeof noticeObject.V}': ${noticeObject.V}`);
        // console.assert(characterIndex !== undefined, "TSV addNoticePartial: 'characterIndex' parameter should be defined");
        if (noticeObject.characterIndex) console.assert(typeof noticeObject.characterIndex === 'number', `TSV addNoticePartial: 'characterIndex' parameter should be a number not a '${typeof noticeObject.characterIndex}': ${noticeObject.characterIndex}`);
        // console.assert(extract !== undefined, "TSV addNoticePartial: 'extract' parameter should be defined");
        if (noticeObject.extract) console.assert(typeof noticeObject.extract === 'string', `TSV addNoticePartial: 'extract' parameter should be a string not a '${typeof noticeObject.extract}': ${noticeObject.extract}`);
        console.assert(noticeObject.location !== undefined, "TSV addNoticePartial: 'location' parameter should be defined");
        console.assert(typeof noticeObject.location === 'string', `TSV addNoticePartial: 'location' parameter should be a string not a '${typeof noticeObject.location}': ${noticeObject.location}`);
        if (noticeObject.debugChain) noticeObject.debugChain = `checkTN_TSVText ${noticeObject.debugChain}`;
        ttResult.noticeList.push({ ...noticeObject, bookID, filename });
    }


    let extractLength;
    try {
        extractLength = checkingOptions?.extractLength;
    } catch (ttcError) { }
    if (typeof extractLength !== 'number' || isNaN(extractLength)) {
        extractLength = DEFAULT_EXTRACT_LENGTH;
        // console.log(`Using default extractLength=${extractLength}`);
    }
    // else
    // console.log(`Using supplied extractLength=${extractLength}`, `cf. default=${DEFAULT_EXTRACT_LENGTH}`);
    // const halfLength = Math.floor(extractLength / 2); // rounded down
    // const halfLengthPlus = Math.floor((extractLength + 1) / 2); // rounded up
    // console.log(`Using halfLength=${halfLength}`, `halfLengthPlus=${halfLengthPlus}`);

    let lowercaseBookID = bookID.toLowerCase();
    let numChaptersThisBook = 0;
    try {
        console.assert(lowercaseBookID !== 'obs', "Shouldn’t happen in tn_table-text-check");
        numChaptersThisBook = books.chaptersInBook(lowercaseBookID).length;
    }
    catch {
        if (!books.isValidBookID(bookID)) // must not be in FRT, BAK, etc.
            addNoticePartial({ priority: 747, message: "Bad function call: should be given a valid book abbreviation", extract: bookID, location: ` (not '${bookID}')${ourLocation}` });
    }

    let lines = tableText.split('\n');
    // console.log(`  '${location}' has ${lines.length.toLocaleString()} total lines (expecting ${NUM_EXPECTED_TN_FIELDS} fields in each line)`);

    let lastB = '', lastC = '', lastV = '';
    let rowIDList = [], uniqueRowList = [];
    let numVersesThisChapter = 0;
    for (let n = 0; n < lines.length; n++) {
        // console.log(`checkTN_TSVText checking line ${n}: ${JSON.stringify(lines[n])}`);
        if (n === 0) {
            if (lines[0] === EXPECTED_TN_HEADING_LINE)
                addSuccessMessage(`Checked TSV header ${ourLocation}`);
            else
                addNoticePartial({ priority: 746, message: "Bad TSV header", lineNumber: n + 1, location: `${ourLocation}: '${lines[0]}'` });
        }
        else // not the header
        {
            let fields = lines[n].split('\t');
            if (fields.length === NUM_EXPECTED_TN_TSV_FIELDS) {
                // eslint-disable-next-line no-unused-vars
                const [B, C, V, rowID, supportReference, origQuote, occurrence, _GLQuote, _occurrenceNote] = fields;

                // Use the row check to do most basic checks
                const drResultObject = await checkTN_TSVDataRow(languageCode, lines[n], bookID, C, V, ourLocation, checkingOptions);
                // Choose only ONE of the following
                // This is the fast way of append the results from this field
                // result.noticeList = result.noticeList.concat(firstResult.noticeList);
                // If we need to put everything through addNoticePartial, e.g., for debugging or filtering
                //  process results line by line
                for (const drNoticeEntry of drResultObject.noticeList)
                    if (drNoticeEntry.extra) // it must be an indirect check on a TA or TW article from a TN check
                        ttResult.noticeList.push(drNoticeEntry); // Just copy the complete notice as is
                    else
                        addNoticePartial({ ...drNoticeEntry, lineNumber: n + 1 });
                // The following is needed coz we might be checking the linked TA and/or TW articles
                if (drResultObject.checkedFileCount && drResultObject.checkedFileCount > 0)
                    if (typeof ttResult.checkedFileCount === 'number') ttResult.checkedFileCount += drResultObject.checkedFileCount;
                    else ttResult.checkedFileCount = drResultObject.checkedFileCount;
                if (drResultObject.checkedFilesizes && drResultObject.checkedFilesizes > 0)
                    if (typeof ttResult.checkedFilesizes === 'number') ttResult.checkedFilesizes += drResultObject.checkedFilesizes;
                    else ttResult.checkedFilesizes = drResultObject.checkedFilesizes;
                if (drResultObject.checkedRepoNames && drResultObject.checkedRepoNames.length > 0)
                    for (const checkedRepoName of drResultObject.checkedRepoNames)
                        try { if (ttResult.checkedRepoNames.indexOf(checkedRepoName) < 0) ttResult.checkedRepoNames.push(checkedRepoName); }
                        catch { ttResult.checkedRepoNames = [checkedRepoName]; }
                if (drResultObject.checkedFilenameExtensions && drResultObject.checkedFilenameExtensions.length > 0)
                    for (const checkedFilenameExtension of drResultObject.checkedFilenameExtensions)
                        try { if (ttResult.checkedFilenameExtensions.indexOf(checkedFilenameExtension) < 0) ttResult.checkedFilenameExtensions.push(checkedFilenameExtension); }
                        catch { ttResult.checkedFilenameExtensions = [checkedFilenameExtension]; }
                // if (ttResult.checkedFilenameExtensions) console.log("ttResult", JSON.stringify(ttResult));

                // So here we only have to check against the previous and next fields for out-of-order problems and duplicate problems
                if (B !== lastB || C !== lastC || V !== lastV) {
                    rowIDList = []; // ID's only need to be unique within each verse
                    uniqueRowList = []; // Same for these
                }

                // TODO: Check if we need this at all (even though tC 3.0 can’t display these "duplicate" notes)
                // Check for duplicate notes
                const uniqueID = C + V + supportReference + origQuote + occurrence; // This combination should not be repeated
                // if (uniqueRowList.includes(uniqueID))
                //     addNoticePartial({ priority: 880, C, V, message: `Duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                // if (uniqueRowList.includes(uniqueID))
                //     addNoticePartial({ priority: 80, C, V, message: `Note: tC 3.0 won’t display duplicate note`, rowID, lineNumber: n + 1, location: ourLocation });
                uniqueRowList.push(uniqueID);

                if (B) {
                    if (B !== bookID)
                        addNoticePartial({ priority: 745, C, V, message: `Wrong '${B}' book identifier (expected '${bookID}')`, rowID, lineNumber: n + 1, location: ourLocation });
                }
                else
                    addNoticePartial({ priority: 744, C, V, message: "Missing book identifier", rowID, lineNumber: n + 1, location: ourLocation });

                if (C) {
                    if (C === 'front') { }
                    else if (/^\d+$/.test(C)) {
                        let intC = Number(C);
                        if (C !== lastC)
                            numVersesThisChapter = books.versesInChapter(lowercaseBookID, intC);
                        if (intC === 0)
                            addNoticePartial({ priority: 551, C, V, message: `Invalid zero chapter number`, rowID, lineNumber: n + 1, extract: C, location: ourLocation });
                        if (intC > numChaptersThisBook)
                            addNoticePartial({ priority: 737, C, V, message: "Invalid large chapter number", rowID, lineNumber: n + 1, extract: C, location: ourLocation });
                        if (/^\d+$/.test(lastC)) {
                            let lastintC = Number(lastC);
                            if (intC < lastintC)
                                addNoticePartial({ priority: 736, C, V, message: "Receding chapter number", details: `'${C}' after '${lastC}'`, rowID, lineNumber: n + 1, location: ourLocation });
                            else if (intC > lastintC + 1)
                                addNoticePartial({ priority: 735, C, V, message: "Advancing chapter number", details: `'${C}' after '${lastC}'`.rowID, lineNumber: n + 1, location: ourLocation });
                        }
                    }
                    else
                        addNoticePartial({ priority: 734, C, V, message: "Bad chapter number", rowID, lineNumber: n + 1, location: ourLocation });
                }
                else
                    addNoticePartial({ priority: 739, C, V, message: "Missing chapter number", rowID, lineNumber: n + 1, location: ` after ${lastC}:${V}${ourLocation}` });

                if (V) {
                    if (V === 'intro') { }
                    else if (/^\d+$/.test(V)) {
                        let intV = Number(V);
                        if (intV === 0)
                            addNoticePartial({ priority: 552, C, V, message: "Invalid zero verse number", details: `for chapter ${C}`, rowID, lineNumber: n + 1, extract: V, location: ourLocation });
                        if (intV > numVersesThisChapter)
                            addNoticePartial({ priority: 734, C, V, message: "Invalid large verse number", details: `for chapter ${C}`, rowID, lineNumber: n + 1, extract: V, location: ourLocation });
                        if (/^\d+$/.test(lastV)) {
                            let lastintV = Number(lastV);
                            if (C === lastC && intV < lastintV)
                                addNoticePartial({ priority: 733, C, V, message: "Receding verse number", details: `'${V}' after '${lastV} for chapter ${C}`, rowID, lineNumber: n + 1, extract: V, location: ourLocation });
                            // else if (intV > lastintV + 1)
                            //   addNoticePartial({priority:556, "Skipped verses with '${V}' verse number after '${lastV}'${withString}`);
                        }
                    }
                    else
                        addNoticePartial({ priority: 738, C, V, message: "Bad verse number", rowID, lineNumber: n + 1, location: ourLocation });

                }
                else
                    addNoticePartial({ priority: 790, C, V, message: "Missing verse number", rowID, lineNumber: n + 1, location: ` after ${C}:${lastV}${ourLocation}` });

                if (rowID) {
                    if (rowIDList.includes(rowID))
                        addNoticePartial({ priority: 729, C, V, message: `Duplicate '${rowID}' ID`, fieldName: 'ID', rowID, lineNumber: n + 1, location: ourLocation });
                } else
                    addNoticePartial({ priority: 730, C, V, message: "Missing ID", fieldName: 'ID', lineNumber: n + 1, location: ourLocation });


                lastB = B; lastC = C; lastV = V;

            } else // wrong number of fields in the row
                // if (n === lines.length - 1) // it’s the last line
                //     console.log(`  Line ${n}: Has ${fields.length} field(s) instead of ${NUM_EXPECTED_TN_FIELDS}: ${EXPECTED_TN_HEADING_LINE.replace(/\t/g, ', ')}`);
                // else
                if (n !== lines.length - 1) { // it’s not the last line
                    // Have a go at getting some of the first fields out of the line
                    let C = '?', V = '?', rowID = '????';
                    try { C = fields[1]; } catch { }
                    try { V = fields[2]; } catch { }
                    try { rowID = fields[3]; } catch { }
                    addNoticePartial({ priority: 988, message: `Wrong number of tabbed fields (expected ${NUM_EXPECTED_TN_TSV_FIELDS})`, extract: `Found ${fields.length} field${fields.length === 1 ? '' : 's'}`, C, V, rowID, lineNumber: n + 1, location: ourLocation });
                }
        }
    }

    if (!checkingOptions?.suppressNoticeDisablingFlag) {
        // console.log(`checkTN_TSVText: calling removeDisabledNotices(${ttResult.noticeList.length}) having ${JSON.stringify(checkingOptions)}`);
        ttResult.noticeList = removeDisabledNotices(ttResult.noticeList);
    }

    if ((!checkingOptions?.cutoffPriorityLevel || checkingOptions?.cutoffPriorityLevel < 20)
        && checkingOptions?.disableAllLinkFetchingFlag)
        addNoticePartial({ priority: 20, message: "Note that 'disableAllLinkFetchingFlag' was set so link targets were not checked", location: ourLocation });

    addSuccessMessage(`Checked all ${(lines.length - 1).toLocaleString()} data line${lines.length - 1 === 1 ? '' : 's'}${ourLocation}.`);
    if (ttResult.noticeList)
        addSuccessMessage(`checkTN_TSVText v${TN_TABLE_TEXT_VALIDATOR_VERSION_STRING} finished with ${ttResult.noticeList.length ? ttResult.noticeList.length.toLocaleString() : "zero"} notice${ttResult.noticeList.length === 1 ? '' : 's'}`);
    else
        addSuccessMessage(`No errors or warnings found by checkTN_TSVText v${TN_TABLE_TEXT_VALIDATOR_VERSION_STRING}`)
    // console.log(`  checkTN_TSVText returning with ${result.successList.length.toLocaleString()} success(es), ${result.noticeList.length.toLocaleString()} notice(s).`);
    // console.log("checkTN_TSVText result is", JSON.stringify(result));
    return ttResult;
}
// end of checkTN_TSVText function
