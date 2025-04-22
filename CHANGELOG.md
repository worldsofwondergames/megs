# CHANGELOG

## 0.4.0 (May 15, 2024)
- Officially entered beta with a very barebones system

## 0.5.0 (December 7, 2024)
- Added generic skill tree
- Various bug fixes

## 0.5.1 (December 25, 2024)
- Added direct roll macro capability for skills
- Fixed bug with unskilled rolls when targeting
- Minor code cleanup and simplification

## 0.5.2 (January 11, 2025)
 - Edit lock capability for actors and items
 - Macro fixes and simplification for skills/subskills
 - Bug fixes from user submissions
 
## 0.5.3 (February 24, 2025)
 - Fixed bug that defaulted macros to looking at selected token actor instead of macro's actor
 - Fixed bug that had all rolls from Item object defaulting to unskilled (-2 column shifts)
 - Allow skills and subskills to be editable
 - Updated README to conform to requests by Foundry devs
 - Added locations as Actors (still some cleanup to do here)
 - Portuguese language support (many thanks to @rodrigomiranda on Discord!)
 - Several minor bug and typo fixes

## 0.6.0 (April 19, 2025)
- Allow current scores to be negative (up to negative value of base attribute)
- Made some technical changes caused by Foundry changes around select components
- Limited item durability to the delimited values (0, 2, 3, 5, 7, 9, 11)
- Fixed some yes/no labels that were showing as true/false
- Fixed motivation to display label when uneditable
- Fixed description page to not show raw HTML when non-editable
- Localized several labels missed in previous efforts to selected language
- Made some fields missed in 0.5.3 uneditable when not in edit mode
- Corrected tabbing when actor page open
- Fixed reliability display value on gadgets
- Linked powers now display asterisk
- Cleanup minor code issues from static code analysis
