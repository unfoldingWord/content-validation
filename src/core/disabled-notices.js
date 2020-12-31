/* This file handles the suppression of notices where we don’t want to disable or remove the actual check,
    but we just want to disable it for certain resources to handle special cases.
    In some cases, it’s to handle software deficiencies.

  NOTE: This is only recommended for resources which are relatively stable,
          e.g., completed book packages
        as it can rely on details like filename and maybe line number.
*/


// const DISABLED_NOTICES_VERSION_STRING = '0.2.0';


const disabledNotices = [
  // Just enter enough details to disable the required message(s) and no unwanted ones
  //  i.e., you can be as specific as you need about username and/or lineNumber, etc.

  // TODO: Remove this -- it’s only temporary to handle valid TN links like [](../02/20/zu5f) that are checked as issues
  { repoCode: 'TN', priority: 648, }, // "More [ ]( ) links than valid Bible links" not yet properly handled by this package

  { repoCode: 'TN', priority: 450, }, // TN "Resource container link should have '*' language code with (not 'en')" as tC can’t handle it yet!

  { repoCode: 'ST', message: "Bad punctuation nesting: } closing character doesn’t match", bookID: 'NEH', }, // 777 - complex { } nesting in direct speech
  { repoCode: 'ST', message: "Bad punctuation nesting: ” closing character doesn’t match", bookID: 'NEH', }, // 777 - complex { } nesting in direct speech

  { repoCode: 'LT', priority: 638, fieldName: '\\p', }, // "Only found whitespace" tC3 outputs trailing spaces here
  { repoCode: 'ST', priority: 638, fieldName: '\\p', }, // "Only found whitespace" tC3 outputs trailing spaces here
  { repoCode: 'LT', priority: 124, extract: '\\p␣␣', }, // "Unexpected double spaces" tC3 outputs trailing spaces here
  { repoCode: 'ST', priority: 124, extract: '\\p␣␣', }, // "Unexpected double spaces" tC3 outputs trailing spaces here
  { repoCode: 'LT', message: "Unexpected space after | character", }, // 192 tC3 outputs an unneeded/unwanted space in \zaln-s
  { repoCode: 'ST', message: "Unexpected space after | character", }, // 192 tC3 outputs an unneeded/unwanted space in \zaln-s
  { repoCode: 'LT', priority: 95, }, // "Unexpected trailing space(s)" tC3 outputs trailing spaces all over the place
  { repoCode: 'ST', priority: 95, }, // "Unexpected trailing space(s)" tC3 outputs trailing spaces all over the place

  { repoCode: 'TA', priority: 104, }, // "Unexpected trailing line break" UTA uses trailing <BR> for (1) (2) (3) style numbered lists

  { repoCode: 'TA', message: "Unexpected – character after space", }, // 191 -- temp en-dashes
  { repoCode: 'TA', message: "Unexpected space after – character", }, // 192 -- temp en-dashes

  { repoCode: 'TA', priority: 172, }, // "Header levels should only increment by one" not required for TA

  { repoCode: 'TA', filename: 'translate/translate-alphabet/01.md', message: "At end of text with unclosed ‘ opening character", }, // 768
  { repoCode: 'TA', filename: 'translate/translate-alphabet/01.md', message: "Mismatched ‘’ characters", }, // 462
  { repoCode: 'TA', filename: 'translate/translate-textvariants/01.md', message: "Unexpected space after [ character", }, // 192
  { repoCode: 'TA', filename: 'translate/translate-formatsignals/01.md', message: "Unexpected space after ( character", }, // 192

  // This file has a space-separated list of typical quotation symbols
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after “ character", lineNumber: 3, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after “ character", lineNumber: 16, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after ‘ character", lineNumber: 16, }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after « character", }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after ‹ character", }, // 192
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected space after — character", }, // 192

  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected . character after space", lineNumber: 16, }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected ” character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected ’ character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected » character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected › character after space", }, // 191
  { repoCode: 'TA', filename: 'translate/figs-quotemarks/01.md', message: "Unexpected — character after space", }, // 191

  { repoCode: 'TA', filename: 'translate/figs-metaphor/01.md', message: "Possible misplaced ( character", }, // 17
];


/**
 *
 * @param {Object} givenNotice
 * @returns true if the givenNotice has a match in the disabledNotices list above
 */
export function isDisabledNotice(givenNotice) {
  // if (givenNotice.priority===638) console.log(`isDisabledNotice(${JSON.stringify(givenNotice)})…`);
  for (const disabledNotice of disabledNotices) {
    let matched = true;
    for (const propertyName in disabledNotice)
      if (givenNotice[propertyName] !== disabledNotice[propertyName]) {
        matched = false;
        break;
      }
    if (matched) return true;
  }
  return false;
}


/**
 *
 * @param {Array} givenNoticeList
 * @returns a new list of notices with disabled ones removed
 */
export function removeDisabledNotices(givenNoticeList) {
  const remainingNoticeList = [];
  for (const thisNotice of givenNoticeList) {
      if (!isDisabledNotice(thisNotice))
          remainingNoticeList.push(thisNotice);
  }
  // console.log(`removeDisabledNotices: returning ${remainingNoticeList.length} from ${givenNoticeList.length} notices`);
  return remainingNoticeList;
}