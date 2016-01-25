'use strict';


module.exports = function(app) {
  app.task('default', function(cb) {

    console.log('examples');
    cb();
  });
};
