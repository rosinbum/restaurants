# Backend Engineer coding test

##Updated: 12/09/2021

Given the following CSV file, write a function named findOpenRestaurants(csvFilename, searchDatetime) which takes as parameters a fileName and a Date object and returns a list
of restaurant names which are open on that date and time along with the number of milliseconds before the restaurant is closed. The list should be ordered by the restaurants that are going to close in the least amount of time first.
Your answer must be written in Typescript and should run in NodeJS 16 or newer. The only modules allowed to be used are the ones bundled with NodeJS.

###Assumptions

* If a day of the week is not listed, the restaurant is closed on that day
* All times are local — don’t worry about timezone-awareness
* The CSV file always will be well-formed

