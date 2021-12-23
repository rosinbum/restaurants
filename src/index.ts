#!/usr/bin/env node

import findOpenRestaurants from './openRestaurants';

console.log('starting cli');
console.log(process.argv);

findOpenRestaurants('restaurants', new Date());
