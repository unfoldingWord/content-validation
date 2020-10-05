import React, { useState, useEffect } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { processNoticesToErrorsWarnings, processNoticesToSevereMediumLow, processNoticesToSingleList } from '../notice-processing-functions';
import { RenderSuccessesErrorsWarnings, RenderSuccessesSevereMediumLow, RenderSuccessesWarningsGradient, RenderElapsedTime } from '../RenderProcessedResults';
import { preloadReposIfNecessary, ourParseInt } from '../../core';
import { checkRepo } from './checkRepo';
// import { consoleLogObject, displayPropertyNames } from '../../core/utilities';


//const VALIDATOR_VERSION_STRING = '0.1.2';


function RepoCheck(/*username, languageCode,*/ props) {
    /*
    Check an entire repository

    Loads the zip file and the repo tree
        and then checks all the individual files
    */

    // console.log(`I'm here in RepoCheck v${VALIDATOR_VERSION_STRING}`);
    // consoleLogObject("props", props);
    // consoleLogObject("props.classes", props.classes);

    const username = props.username;
    // console.log(`username='${username}'`);
    const repoName = props.repoName;
    // console.log(`repoName='${repoName}'`);
    let branch = props.branch;
    // console.log(`branch='${branch}'`);
    if (branch === undefined) branch = 'master';

    const checkingOptions = { // Uncomment any of these to test them
        // extractLength: 25,
    };
    // Or this allows the parameters to be specified as a RepoCheck property
    if (props.extractLength) checkingOptions.extractLength = ourParseInt(props.extractLength);


    const [result, setResultValue] = useState("Waiting-checkRepo");
    useEffect(() => {
        // console.log("RepoCheck.useEffect() called with ", JSON.stringify(props));

        // Use an IIFE (Immediately Invoked Function Expression)
        //  e.g., see https://medium.com/javascript-in-plain-english/https-medium-com-javascript-in-plain-english-stop-feeling-iffy-about-using-an-iife-7b0292aba174
        (async () => {
            // console.log("Started RepoCheck.unnamedFunction()");

            if (!repoName) {
                setResultValue(<p style={{ color: 'red' }}>No <b>repoName</b> set!</p>);
                return;
            }
            let [languageCode,repoCode] = repoName.split('_');
            repoCode = repoCode.toUpperCase();
            console.log(`languageCode='${languageCode}' repoCode='${repoCode}'`);

            setResultValue(<p style={{ color: 'magenta' }}>Preloading repos for {username} {languageCode} ready for {repoName} repo check…</p>);
            const repoList = ['TA', 'TW'];
            if (repoCode !== 'TA' && repoCode !== 'TW') repoList.push(repoCode);
            const successFlag = await preloadReposIfNecessary(username, languageCode, [], branch, repoList);
            if (!successFlag)
                console.error(`RepoCheck error: Failed to pre-load all repos`)

            // Display our "waiting" message
            setResultValue(<p style={{ color: 'magenta' }}>Checking <b>{repoName}</b> repo…</p>);

            // Put all this in a try/catch block coz otherwise it's difficult to debug/view errors
            try {
                let rawCRResults = {};
                try {
                    rawCRResults = await checkRepo(username, repoName, branch, "", setResultValue, checkingOptions);
                } catch (checkRepoError) {
                    rawCRResults = { successList: [], noticeList: [] };
                    rawCRResults.noticeList.push({ priority: 999, message: "checkRepo function FAILED", repoName, extract: checkRepoError, location: repoName });
                }
                // console.log("checkRepo() returned", typeof rawCRResults); //, JSON.stringify(rawCRResults));

                // Add some extra fields to our rawCRResults object in case we need this information again later
                rawCRResults.checkType = 'Repo';
                rawCRResults.username = username;
                rawCRResults.languageCode = languageCode;
                rawCRResults.checkedOptions = checkingOptions;

                // Because we know here that we're only checking one repo, we don't need the repoName field in the notices
                function deleteRepoNameField(notice) { delete notice.repoName; return notice; }
                rawCRResults.noticeList = rawCRResults.noticeList.map(deleteRepoNameField);

                // console.log("Here with RC rawCRResults", typeof rawCRResults);
                // Now do our final handling of the result -- we have some options available
                let processOptions = { // Uncomment any of these to test them
                    // 'maximumSimilarMessages': 4, // default is 3 -- 0 means don't suppress
                    // 'errorPriorityLevel': 800, // default is 700
                    // 'cutoffPriorityLevel': 100, // default is 0
                    // 'sortBy': 'ByPriority', // default is 'AsFound'
                    // 'ignorePriorityNumberList': [123, 202], // default is []
                };
                // Or this allows the parameters to be specified as a RepoCheck property
                if (props.maximumSimilarMessages) processOptions.maximumSimilarMessages = ourParseInt(props.maximumSimilarMessages);
                if (props.errorPriorityLevel) processOptions.errorPriorityLevel = ourParseInt(props.errorPriorityLevel);
                if (props.cutoffPriorityLevel) processOptions.cutoffPriorityLevel = ourParseInt(props.cutoffPriorityLevel);
                if (props.sortBy) processOptions.sortBy = props.sortBy;
                // if (props.ignorePriorityNumberList) processOptions.ignorePriorityNumberList = props.ignorePriorityNumberList;

                let displayType = 'ErrorsWarnings'; // default
                if (props.displayType) displayType = props.displayType;

                function renderSuccesses(processedResults) {
                    if (processedResults.checkedFileCount > 0)
                        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;Successfully checked {processedResults.checkedFileCount.toLocaleString()} file{processedResults.checkedFileCount === 1 ? '' : 's'} from {username} {processedResults.checkedRepoNames.join(', ')}
                            <br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;including {processedResults.checkedFilenameExtensions.length} file type{processedResults.checkedFilenameExtensions.size === 1 ? '' : 's'}: {processedResults.checkedFilenameExtensions.join(', ')}.</p>);
                    else
                        return (<p>&nbsp;&nbsp;&nbsp;&nbsp;No files checked!</p>);
                }

                function renderSummary(processedResults) {
                    return (<div>
                        <p>Checked <b>{username} {repoName}</b> (from <i>{branch === undefined ? 'DEFAULT' : branch}</i> branch)</p>
                        {renderSuccesses(processedResults)}
                        <p>&nbsp;&nbsp;&nbsp;&nbsp;Finished in <RenderElapsedTime elapsedSeconds={processedResults.elapsedSeconds} /> with {rawCRResults.noticeList.length === 0 ? 'no' : rawCRResults.noticeList.length.toLocaleString()} notice{rawCRResults.noticeList.length === 1 ? '' : 's'}.</p>
                        {/* <RenderRawResults results={rawCRResults} /> */}
                    </div>);
                }

                if (displayType === 'ErrorsWarnings') {
                    const processedResults = processNoticesToErrorsWarnings(rawCRResults, processOptions);
                    // displayPropertyNames("RC processedResults", processedResults);
                    //             console.log(`RepoCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
                    //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, "numSuppressedErrors=" + processedResults.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + processedResults.numSuppressedWarnings.toLocaleString());

                    // console.log("Here now in rendering bit!");

                    if (processedResults.errorList.length || processedResults.warningList.length)
                        setResultValue(<>
                            <div>{renderSummary(processedResults)}
                                {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
                            <RenderSuccessesErrorsWarnings results={processedResults} />
                        </>);
                    else // no errors or warnings
                        setResultValue(<>
                            <div>{renderSummary(processedResults)}
                                {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</div>
                            <RenderSuccessesErrorsWarnings results={processedResults} />
                        </>);
                } else if (displayType === 'SevereMediumLow') {
                    const processedResults = processNoticesToSevereMediumLow(rawCRResults, processOptions);
                    //             console.log(`RepoCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s), ${processedResults.errorList.length.toLocaleString()} error(s) and ${processedResults.warningList.length.toLocaleString()} warning(s)
                    //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()}`, "numSuppressedErrors=" + processedResults.numSuppressedErrors.toLocaleString(), "numSuppressedWarnings=" + processedResults.numSuppressedWarnings.toLocaleString());

                    if (processedResults.severeList.length || processedResults.mediumList.length || processedResults.lowList.length)
                        setResultValue(<>
                            <div>{renderSummary(processedResults)}
                                {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
                            <RenderSuccessesSevereMediumLow results={processedResults} />
                        </>);
                    else // no severe, medium, or low notices
                        setResultValue(<>
                            <div>{renderSummary(processedResults)}
                                {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</div>
                            <RenderSuccessesSevereMediumLow results={processedResults} />
                        </>);
                } else if (displayType === 'SingleList') {
                    const processedResults = processNoticesToSingleList(rawCRResults, processOptions);
                    // console.log(`RepoCheck got back processedResults with ${processedResults.successList.length.toLocaleString()} success message(s) and ${processedResults.warningList.length.toLocaleString()} notice(s)
                    //   numIgnoredNotices=${processedResults.numIgnoredNotices.toLocaleString()} numSuppressedWarnings=${processedResults.numSuppressedWarnings.toLocaleString()}`);

                    if (processedResults.warningList.length)
                        setResultValue(<>
                            <div>{renderSummary(processedResults)}
                                {processedResults.numIgnoredNotices ? ` (but ${processedResults.numIgnoredNotices.toLocaleString()} ignored errors/warnings)` : ""}</div>
                            <RenderSuccessesWarningsGradient results={processedResults} />
                        </>);
                    else // no warnings
                        setResultValue(<>
                            <div>{renderSummary(processedResults)}
                                {processedResults.numIgnoredNotices ? ` (with a total of ${processedResults.numIgnoredNotices.toLocaleString()} notices ignored)` : ""}</div>
                            <RenderSuccessesWarningsGradient results={processedResults} />
                        </>);
                } else setResultValue(<b style={{ color: 'red' }}>Invalid displayType='{displayType}'</b>)

                // console.log("Finished rendering bit.");
            } catch (rcError) {
                console.error(`RepoCheck main code block got error: ${rcError.message}`);
                setResultValue(<>
                    <p style={{ color: 'red' }}>RepoCheck main code block got error: <b>{rcError.message}</b></p>
                </>);
            }
        })(); // end of async part in unnamedFunction
        // Doesn't work if we add this to next line: languageCode,username,repoName,branch,checkingOptions,props
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // end of useEffect part

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
            {result}
        </div>
    );
}

// RepoCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   languageCode: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

const styles = theme => ({
    root: {
    },
});

export default withStyles(styles)(RepoCheck);
