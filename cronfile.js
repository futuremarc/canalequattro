 var cron = require('node-cron');

 // # ┌────────────── second (optional)
 // # │ ┌──────────── minute
 // # │ │ ┌────────── hour
 // # │ │ │ ┌──────── day of month
 // # │ │ │ │ ┌────── month
 // # │ │ │ │ │ ┌──── day of week
 // # │ │ │ │ │ │
 // # │ │ │ │ │ │
 // # * * * * * *


 module.exports = function() {

   cron.schedule('1-59 * * * *', function() {
     console.log('running every minute');
   });


   cron.schedule('* * * January,September Sunday', function() {
     console.log('running on Sundays of January and September');
   });

 }