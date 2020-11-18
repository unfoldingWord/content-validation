import React from 'react';
// import { forwardRef } from 'react';

// NOTE: The following line is currently giving compile warnings -- a problem in a dependency it seems
import MaterialTable from 'material-table';


// const RENDER_PROCESSED_RESULTS_VERSION = '0.5.4';


export function RenderSuccesses({ username, results }) {
    if (results.checkedFileCount > 0)
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {results.checkedFileCount.toLocaleString()} file{results.checkedFileCount === 1 ? '' : 's'} from {results.checkedRepoNames.length.toLocaleString()} {username} repo{results.checkedRepoNames.length === 1 ? '' : 's'}: {results.checkedRepoNames.join(', ')}
            <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {results.checkedFilenameExtensions.length} file type{results.checkedFilenameExtensions.size === 1 ? '' : 's'}: {results.checkedFilenameExtensions.join(', ')}.</p>);
    else
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;No files checked!</p>);
}

export function RenderTotals({ rawNoticeListLength, results }) {
    if (results.numIgnoredNotices || results.numDisabledNotices) {
        const netNumNotices = rawNoticeListLength - results.numIgnoredNotices - results.numDisabledNotices;
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={results.elapsedSeconds} /> with {netNumNotices === 0 ? 'no' : netNumNotices.toLocaleString()} notice{netNumNotices === 1 ? ' ' : 's '}
             ({rawNoticeListLength === 0 ? 'no' : rawNoticeListLength.toLocaleString()} raw notice{rawNoticeListLength === 1 ? '' : 's'} but
            {results.numIgnoredNotices ? ` ${results.numIgnoredNotices.toLocaleString()} ignored notice${results.numIgnoredNotices === 1 ? '' : 's'}` : ""}
            {results.numIgnoredNotices && results.numDisabledNotices ? ' and' : ''}
            {results.numDisabledNotices ? ` ${results.numDisabledNotices.toLocaleString()} disabled notice${results.numDisabledNotices === 1 ? '' : 's'}` : ""}
            ).</p>);
    } else // it's much simpler
        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={results.elapsedSeconds} /> with {rawNoticeListLength === 0 ? 'no' : rawNoticeListLength.toLocaleString()} notice{rawNoticeListLength === 1 ? '' : 's'}.</p>);
}

/**
* @description - Displays a given piece of text (which can include newline characters)
* @param {String} text - text to render as numbered lines
* @return {String} - rendered HTML for the numbered list of lines
*/
export function RenderLines({ text }) {
    return <ol>
        {text.split('\n').map(function (line, index) {
            return <li key={index}>{line}</li>;
        })}
    </ol>;
}


const MAX_ARRAY_ITEMS_TO_DISPLAY = 8; // Or do we want this as a parameter?
/**
* @description - Displays whatever is in the object
* @param {Object} thisObject - object to render
* @param {Array} excludeList - optional list of object property names to be ignored
* @return {String} - rendered HTML for list of thisObject properties
*/
export function RenderObject({ thisObject, excludeList }) {
    // console.log("In RenderObject");
    // consoleLogObject('RenderObject settings', settings);
    return <ul>
        {
            Object.keys(thisObject).map((key, keyIndex) => {
                if (!excludeList || !excludeList.includes(key)) {
                    let displayObject = thisObject[key];
                    if (Array.isArray(displayObject) && displayObject.length > MAX_ARRAY_ITEMS_TO_DISPLAY)
                        displayObject = `(only first ${MAX_ARRAY_ITEMS_TO_DISPLAY} displayed here) ${JSON.stringify(displayObject.slice(0, MAX_ARRAY_ITEMS_TO_DISPLAY))}, etc…`;
                    return (
                        <li key={keyIndex}>&nbsp;&nbsp;&nbsp;&nbsp;
                            <span><b>{key}</b>{Array.isArray(thisObject[key]) ? ` (${thisObject[key].length.toLocaleString()}) ` : ''}: {typeof displayObject === 'object' ? JSON.stringify(displayObject) : displayObject}</span>
                        </li>
                    )
                }
                return null;
            }, [])}
    </ul>;
}


/**
* @description - Displays the raw noticeList in a table
* @param {Object} results - object containing noticeList
* @return {String} - rendered HTML for table of notices
*/
export function RenderRawResults({ results }) {
    // This function is flexible enough to handle notice objects:
    //      including bookID,C,V or not
    //      including repoName, filename, lineNumber or not
    //      including extra or not

    // console.log("In RenderRawResults");
    // consoleLogObject('RenderRawResults results', results);
    // displayPropertyNames('RenderRawResults results', results);

    // Create a list of other property names
    // let propertyList = [], newObject = {};
    // for (const propertyName in results)
    //     if (propertyName !== 'noticeList') {
    //         newObject[propertyName] = results[propertyName];
    //         propertyList.push(<p>{propertyName} = {results[propertyName]}</p>);
    //     }
    // consoleLogObject('propertyList', propertyList);

    if (!results.noticeList || !results.noticeList.length)
        return <>
            <p><b>Raw Results</b> (no notices were produced):</p>
            <RenderObject thisObject={results} excludeList={['noticeList']} />
        </>;
    // If we get here, we have notices.
    // console.log(`Got ${results.noticeList.length} notices`);

    // Discover what fields we have in our notice objects (in order to set our table headers below)
    const allPropertiesSet = new Set();
    let haveOBS = false, haveBible = false;
    // console.log( "allPropertiesSet-A", JSON.stringify([...allPropertiesSet]));
    for (const noticeEntry of results.noticeList)
        // console.log("noticeEntry", JSON.stringify(noticeEntry));
        // console.log(`Found (${Object.keys(noticeEntry).length}) ${Object.keys(noticeEntry)}`);
        for (const [noticePropertyName, noticePropertyValue] of Object.entries(noticeEntry))
            // console.log("  Found", noticePropertyName, "=", noticeEntry[noticePropertyName]);
            if (noticePropertyValue !== undefined) {
                allPropertiesSet.add(noticePropertyName);
                if (noticePropertyName === 'bookID' && noticePropertyValue) {
                    if (noticePropertyValue === 'OBS') haveOBS = true;
                    else haveBible = true;
                }
            }
    // console.log( "allPropertiesSet-Z", JSON.stringify([...allPropertiesSet]));

    // Adjust the headers according to the column sets that we actually have in the noticeList
    let headerData = [
        { title: 'Priority', field: 'priority', type: 'numeric' },
        { title: 'Message', field: 'message' },
    ];
    if (allPropertiesSet.has('details')) headerData = headerData.concat([{ title: 'Details', field: 'details' }]);
    if (allPropertiesSet.has('bookID')) headerData = headerData.concat([{ title: 'Book', field: 'bookID' }]);
    if (allPropertiesSet.has('C') || allPropertiesSet.has('V')) {
        let CName = '???', VName = '???';
        if (haveBible && !haveOBS) { CName = 'Chapter'; VName = 'Verse'; }
        else if (haveOBS && !haveBible) { CName = 'Story'; VName = 'Frame'; }
        else if (haveBible && haveOBS) { CName = 'Chapter/Story'; VName = 'Verse/Frame'; }
        headerData = headerData.concat([
            { title: CName, field: 'C' },
            { title: VName, field: 'V' }
        ]);
    }
    if (allPropertiesSet.has('rowID')) headerData = headerData.concat([{ title: 'row ID', field: 'rowID' }]);
    if (allPropertiesSet.has('repoCode')) headerData = headerData.concat([{ title: 'RepoCode', field: 'repoCode' }]);
    if (allPropertiesSet.has('username')) headerData = headerData.concat([{ title: 'Username', field: 'username' }]);
    if (allPropertiesSet.has('repoName')) headerData = headerData.concat([{ title: 'RepoName', field: 'repoName' }]);
    if (allPropertiesSet.has('filename')) headerData = headerData.concat([{ title: 'Filename', field: 'filename' }]);
    if (allPropertiesSet.has('fieldName')) headerData = headerData.concat([{ title: 'Field', field: 'fieldName' }]);
    if (allPropertiesSet.has('lineNumber')) headerData = headerData.concat([{ title: 'Line', field: 'lineNumber' }]);
    if (allPropertiesSet.has('characterIndex')) headerData = headerData.concat([{ title: 'CharIndex', field: 'characterIndex' }]);
    if (allPropertiesSet.has('extract')) headerData = headerData.concat([{ title: 'Extract', field: 'extract' }]);
    if (allPropertiesSet.has('location')) headerData = headerData.concat([{ title: 'Location', field: 'location' }]);
    if (allPropertiesSet.has('extra')) headerData = headerData.concat([{ title: 'Extra', field: 'extra' }]);
    // console.log("headerData", headerData.length, JSON.stringify(headerData));

    // Make the actual table and return it
    return <>
        <b>Raw Results</b>:
        <RenderObject thisObject={results} />
        <MaterialTable
            // icons={tableIcons}
            title={`All ${results.noticeList.length.toLocaleString()} Raw Notices`}
            columns={headerData}
            data={results.noticeList}
            options={{ sorting: true, exportButton: true, exportAllData: true }}
        />
    </>;
}


/**
* @description - Displays the message plus details if specified
* @param {String} color - color field for the message style
* @param {String} message - notice text
* @param {String} details - (optional) extra notice text
* @return {String} - rendered HTML for the given reference
*/
function RenderMessage({ color, message, details }) {
    let detailsString = '';
    if (details && details.length)
        detailsString = ' with ' + (details[0] === '(' ? details : `'${details}'`);
    return <><b style={{ color: color }}>{message}</b>{detailsString}</>;
}


/**
* @description - Displays the bookcode and chapter/verse details if specified
* @param {String} bookID - (optional) 3-character UPPERCASE USFM bookcode or 'OBS'.
* @param {String} C - (optional) chapter info
* @param {String} V - (optional) verse info
* @return {String} - rendered HTML for the given reference
*/
function RenderBCV({ bookID, C, V }) {
    // These are all optional parameters - they may be undefined or blank if irrelevant
    // console.log(`RenderBCV(${bookID}, ${C}, ${V})`);
    if (!bookID && !C && !V) return null; // They're all undefined or blank!
    // console.log(`RenderBCV2 ${bookID}, ${C}, ${V}`);
    let result;
    if (bookID && bookID.length) result = bookID;
    if (C && C.length) result = `${result}${result.length ? ' ' : ''}${C}`;
    if (V && V.length) result = `${result}${result.length ? ':' : ''}${V}`;
    if (result.length)
        return <> {V && V.length ? 'at' : 'in'} <b>{result}</b></>;
    return null;
}

/**
* @description - Displays the repoName and filename/lineNumber details if specified
* @param {String} username - (optional) username/orgName string
* @param {String} repoName - (optional) repo name string
* @param {String} filename - (optional) filename string
* @param {Number} lineNumber - (optional) line number integer (1-based)
* @param {String} rowID - (optional) 4-character ID field
* @param {String} fieldName - (optional) name of field
* @return {String} - rendered HTML for the given reference
*/
function RenderFileDetails({ username, repoName, filename, lineNumber, rowID, fieldName }) {
    // These are all optional parameters - they may be undefined or blank if irrelevant
    // console.log(`RenderFileDetails(${repoName}, ${filename}, ${lineNumber}, ${rowID}, ${fieldName})`);
    if (!repoName && !filename && !lineNumber && !rowID && !fieldName)
        return null; // They're all undefined or blank!
    // console.log(`RenderFileDetails2 ${repoName}, ${filename}, ${lineNumber}`);
    let resultStart = '', lineResult = '', resultEnd = '', fileLink = '';
    if (repoName && repoName.length) resultStart += ` in ${repoName} repository`;
    if (filename && filename.length) resultStart += ` in file ${filename}`;
    if (lineNumber) {
        resultStart += ' on ';
        if (username && repoName && filename && lineNumber) {
            try {
                if (filename.endsWith('.tsv') || filename.endsWith('.md')) // use blame so we can see the line!
                    fileLink = `https://git.door43.org/${username}/${repoName}/blame/branch/master/${filename}#L${lineNumber}`;
                else fileLink = `https://git.door43.org/${username}/${repoName}/src/branch/master/${filename}#L${lineNumber}`;
            } catch { }
        }
        // else if (!username) resultEnd += " no username";
        // else if (!repoName) resultEnd += " no repoName";
        // else if (!filename) resultEnd += " no filename";
        lineResult = `line ${lineNumber.toLocaleString()}`;
    }
    // else resultEnd += " no lineNumber";
    if (rowID && rowID.length) resultEnd += ` with row ID ${rowID}`;
    if (fieldName && fieldName.length) resultEnd += ` in ${fieldName} field`;
    if (fileLink) return <>{resultStart}<a rel="noopener noreferrer" target="_blank" href={fileLink}>{lineResult}</a>{resultEnd}</>;
    else return <>{resultStart}<b>{lineResult}</b>{resultEnd}</>;
}

function RenderSuccessesColored({ results }) {
    // Display our array of success message strings in a nicer format
    //
    // Expects results to contain:
    //      1/ successList
    // console.log("In RenderSuccessesColored with ", successList);
    // consoleLogObject('RenderSuccessesColored results', results);

    let haveWarnings;
    try { haveWarnings = results.errorList.length || results.warningList.length; }
    catch (e1) {
        try { haveWarnings = results.severeList.length || results.mediumList.length || results.lowList.length; }
        catch (e2) { haveWarnings = results.warningList.length; }
    }

    return <ul>
        {results.successList.map(function (listEntry, index) {
            return <li key={index}>
                <b style={{ color: haveWarnings ? 'limegreen' : 'green' }}>{listEntry}</b>
            </li>;
        })}
    </ul>;
}

/**
 *
 * @param {Object} props.entry -- the given notice entry object
 */
function RenderPriority({ entry }) {
    // Also displays the debugChain (after the priority) if the debugChain string exists
    if (entry.debugChain)
    return <small><span style={{ color: 'Gray' }}> ({entry.priority >= 0 ? "Priority " + entry.priority : ""})</span> <span style={{ color: 'Purple' }}>[{entry.debugChain}]</span></small>
    else
    return <small style={{ color: 'Gray' }}> ({entry.priority >= 0 ? "Priority " + entry.priority : ""})</small>
}

function RenderProcessedArray({ arrayType, results }) {
    // Display our array of objects in a nicer format
    //  priority (integer), message (string)
    //  plus optional fields:
    //      bookID, C, V, repoName, filename, lineNumber
    //      characterIindex (integer), extract (string), location (string)
    //
    // console.log("In RenderProcessedArray with ", arrayType);
    // consoleLogObject('RenderProcessedArray results', results);

    if (arrayType === 's')
        return <>
            <RenderSuccessesColored results={results} />
        </>;
    else { // not 's' (successList)
        const myList = arrayType === 'e' ? results.errorList : results.warningList;
        return <ul>
            {myList.map(function (listEntry, index) {
                return <li key={index}>
                    <RenderMessage color={arrayType === 'e' ? 'red' : 'orange'} message={listEntry.message} details={listEntry.details} />
                    <RenderBCV bookID={listEntry.bookID} C={listEntry.C} V={listEntry.V} />
                    <RenderFileDetails username={listEntry.username} repoName={listEntry.repoName} filename={listEntry.filename} lineNumber={listEntry.lineNumber} rowID={listEntry.rowID} fieldName={listEntry.fieldName} />
                    {listEntry.characterIndex > 0 ? " (at character " + (listEntry.characterIndex + 1) + ")" : ""}
                    <span style={{ color: 'DimGray' }}>{listEntry.extract ? " around '" + listEntry.extract + "'" : ""}</span>
                    {listEntry.location}
                    <RenderPriority entry={listEntry} />
                </li>;
            })}
        </ul>;
    }
}


function RenderGivenArray({ array, color }) {
    // Display our array of objects in a nicer format
    //  priority (integer), message (string),
    //  plus possible optional fields:
    //      bookID, C, V,
    //      repoName, filename, lineNumber,
    //      characterIndex (integer), extract (string), location (descriptive string)
    //
    // console.log("In RenderGivenArray with ", arrayType);
    // consoleLogObject('RenderGivenArray results', results);

    return <ul>
        {array.map(function (listEntry, index) {
            return <li key={index}>
                <RenderMessage color={color} message={listEntry.message} details={listEntry.details} />
                <RenderBCV bookID={listEntry.bookID} C={listEntry.C} V={listEntry.V} />
                <RenderFileDetails username={listEntry.username} repoName={listEntry.repoName} filename={listEntry.filename} lineNumber={listEntry.lineNumber} rowID={listEntry.rowID} fieldName={listEntry.fieldName} />
                {listEntry.characterIndex !== undefined && listEntry.characterIndex >= 0 ? " (at character " + (listEntry.characterIndex + 1) + " of line)" : ""}
                <span style={{ color: 'DimGray' }}>{listEntry.extract ? " around '" + listEntry.extract + "'" : ""}</span>
                {listEntry.location}
                <RenderPriority entry={listEntry} />
            </li>;
        })}
    </ul>;
}


function getGradientcolor(priorityValue) {
    // priorityValue is in range 1..999
    //
    // Returns a color value from red (highest priority) to orange (lower)
    const red = `0${Math.floor(priorityValue * 255 / 999).toString(16)}`.slice(-2);
    // const green = `0${Math.floor((1000-priorityValue) * 55 / 999).toString(16)}`.slice(-2);
    // console.log(`getGradientcolor(${priorityValue}) -> red='${red}' green='${green}'`)
    return `#${red}0000`; // or `#${red}${green}00`
}


function RenderWarningsGradient({ results }) {
    // Display our array of 8-part lists in a nicer format
    //  1/ priority number, 2/ bookID, 3/ C, 4/ V, 5/ message,
    //      6/ index (integer), 7/ extract (optional), 8/ location
    //
    // Expects results to contain:
    //      1/ warningList
    // console.log("In RenderWarningsGradient with ", results.warningList);
    // consoleLogObject('RenderWarningsGradient results', results);

    return <ul>
        {results.warningList.map(function (listEntry, index) {
            const thiscolor = getGradientcolor(listEntry.priority);
            return <li key={index}>
                <RenderMessage color={thiscolor} message={listEntry.message} details={listEntry.details} />
                <RenderBCV bookID={listEntry.bookID} C={listEntry.C} V={listEntry.V} />
                <RenderFileDetails username={listEntry.username} repoName={listEntry.repoName} filename={listEntry.filename} lineNumber={listEntry.lineNumber} rowID={listEntry.rowID} fieldName={listEntry.fieldName} />
                {listEntry.characterIndex !== undefined && listEntry.characterIndex >= 0 ? " (at character " + (listEntry.characterIndex + 1) + " of line)" : ""}
                <span style={{ color: 'DimGray' }}>{listEntry.extract ? " around '" + listEntry.extract + "'" : ""}</span>
                {listEntry.location}
                <RenderPriority entry={listEntry} />
            </li>;
        })}
    </ul>;
}


function RenderErrors({ results }) {
    // console.log("In RenderErrors");
    // consoleLogObject('RenderErrors results', results);
    return <>
        <b style={{ color: results.errorList.length ? 'red' : 'green' }}>{results.errorList.length.toLocaleString()} error{results.errorList.length === 1 ? '' : 's'}</b>{results.errorList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSuppressedErrors ? " (" + results.numSuppressedErrors.toLocaleString() + " similar one" + (results.numSuppressedErrors === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderProcessedArray results={results} arrayType='e' />
    </>;
}
function RenderWarnings({ results }) {
    // console.log("In RenderWarnings");
    // consoleLogObject('RenderWarnings results', results);
    return <>
        <b style={{ color: results.warningList.length ? 'orange' : 'green' }}>{results.warningList.length.toLocaleString()} warning{results.warningList.length === 1 ? '' : 's'}</b>{results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSuppressedWarnings ? " (" + results.numSuppressedWarnings.toLocaleString() + " similar one" + (results.numSuppressedWarnings === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderProcessedArray results={results} arrayType='w' />
    </>;
}
function RenderErrorsAndWarnings({ results }) {
    // console.log("In RenderErrorsAndWarnings");
    // consoleLogObject('RenderErrorsAndWarnings results', results);
    return <>
        <RenderErrors results={results} />
        <RenderWarnings results={results} />
    </>;
}


function RenderSevere({ results }) {
    // console.log("In RenderSevere");
    // consoleLogObject('RenderSevere results', results);
    return <>
        <b style={{ color: results.severeList.length ? 'red' : 'green' }}>{results.severeList.length.toLocaleString()} severe error{results.severeList.length === 1 ? '' : 's'}</b>{results.severeList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSevereSuppressed ? " (" + results.numSevereSuppressed.toLocaleString() + " similar one" + (results.numSevereSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={results.severeList} color='red' />
    </>;
}
function RenderMedium({ results }) {
    // console.log("In RenderSevere");
    // consoleLogObject('RenderSevere results', results);
    return <>
        <b style={{ color: results.mediumList.length ? 'maroon' : 'green' }}>{results.mediumList.length.toLocaleString()} medium error{results.mediumList.length === 1 ? '' : 's'}</b>{results.mediumList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numMediumSuppressed ? " (" + results.numMediumSuppressed.toLocaleString() + " similar one" + (results.numMediumSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={results.mediumList} color='maroon' />
    </>;
}
function RenderLow({ results }) {
    // console.log("In RenderLow");
    // consoleLogObject('RenderLow results', results);
    return <>
        <b style={{ color: results.lowList.length ? 'orange' : 'green' }}>{results.lowList.length.toLocaleString()} other warning{results.lowList.length === 1 ? '' : 's'}</b>{results.lowList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numLowSuppressed ? " (" + results.numLowSuppressed.toLocaleString() + " similar one" + (results.numLowSuppressed === 1 ? '' : 's') + " suppressed)" : ''}</small>
        <RenderGivenArray array={results.lowList} color='orange' />
    </>;
}
function RenderSevereMediumLow({ results }) {
    // console.log("In RenderSevereMediumLow");
    // consoleLogObject('RenderSevereMediumLow results', results);
    return <>
        <RenderSevere results={results} />
        <RenderMedium results={results} />
        <RenderLow results={results} />
    </>;
}


export function RenderSuccessesErrorsWarnings({ results }) {
    // console.log("In RenderSuccessesErrorsWarnings");

    // consoleLogObject('RenderSuccessesErrorsWarnings results', results);

    const haveErrorsOrWarnings = results.errorList.length || results.warningList.length;

    let successCount;
    if (results.successList.length === 1) successCount = 'One';
    else if (results.successList.length === 2) successCount = 'Two';
    else if (results.successList.length === 3) successCount = 'Three';
    else if (results.successList.length === 4) successCount = 'Four';
    else if (results.successList.length === 5) successCount = 'Five';
    else successCount = results.successList.length.toLocaleString();

    return <>
        <b style={{ color: haveErrorsOrWarnings ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{results.successList.length === 1 ? '' : 's'} completed</b>{results.successList.length ? ':' : ''}
        <RenderSuccessesColored results={results} />
        {haveErrorsOrWarnings ? <RenderErrorsAndWarnings results={results} /> : ""}
    </>;
}


export function RenderSuccessesSevereMediumLow({ results }) {
    // console.log("In RenderSuccessesSevereMediumLow");

    // consoleLogObject('RenderSuccessesSevereMediumLow results', results);

    const haveErrorsOrWarnings = results.severeList.length || results.mediumList.length || results.lowList.length;

    let successCount;
    if (results.successList.length === 1) successCount = 'One';
    else if (results.successList.length === 2) successCount = 'Two';
    else if (results.successList.length === 3) successCount = 'Three';
    else if (results.successList.length === 4) successCount = 'Four';
    else if (results.successList.length === 5) successCount = 'Five';
    else successCount = results.successList.length.toLocaleString();

    return <>
        <b style={{ color: haveErrorsOrWarnings ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{results.successList.length === 1 ? '' : 's'} completed</b>{results.successList.length ? ':' : ''}
        <RenderSuccessesColored results={results} />
        {haveErrorsOrWarnings ? <RenderSevereMediumLow results={results} /> : ""}
    </>;
}

export function RenderSuccessesWarningsGradient({ results }) {
    // console.log("In RenderSuccessesWarningsGradient");

    // consoleLogObject('RenderSuccessesWarningsGradient results', results);

    let successCount;
    if (results.successList.length === 1) successCount = 'One';
    else if (results.successList.length === 2) successCount = 'Two';
    else if (results.successList.length === 3) successCount = 'Three';
    else if (results.successList.length === 4) successCount = 'Four';
    else if (results.successList.length === 5) successCount = 'Five';
    else successCount = results.successList.length.toLocaleString();

    return <>
        <b style={{ color: results.warningList.length ? 'limegreen' : 'green' }}>{successCount.toLocaleString()} check{results.successList.length === 1 ? '' : 's'} completed</b>{results.successList.length ? ':' : ''}
        <RenderSuccessesColored results={results} />
        <b style={{ color: results.warningList.length ? 'orange' : 'green' }}>{results.warningList.length.toLocaleString()} warning notice{results.warningList.length === 1 ? '' : 's'}</b>{results.warningList.length ? ':' : ''}
        <small style={{ color: 'Gray' }}>{results.numSuppressedWarnings ? " (" + results.numSuppressedWarnings.toLocaleString() + " similar one" + (results.numSuppressedWarnings === 1 ? '' : 's') + " suppressed)" : ''}</small>
        {results.warningList.length ? <RenderWarningsGradient results={results} /> : ""}
    </>;
}


export function RenderElapsedTime({ elapsedSeconds }) {
    const seconds = Math.round(elapsedSeconds % 60);
    let remainingTime = Math.floor(elapsedSeconds / 60);
    const minutes = Math.round(remainingTime % 60);
    remainingTime = Math.floor(remainingTime / 60);
    const hours = Math.round(remainingTime % 24);
    remainingTime = Math.floor(remainingTime / 24);
    console.assert(remainingTime === 0, `Elapsed time also contains ${remainingTime} days`);
    return <>{hours ? `${hours} hour` : ''}{hours && hours !== 1 ? 's' : ''}{hours ? ', ' : ''}{minutes ? `${minutes} minute` : ''}{minutes && minutes !== 1 ? 's' : ''}{minutes ? ', ' : ''}{seconds} second{seconds === 1 ? '' : 's'}</>;
}
