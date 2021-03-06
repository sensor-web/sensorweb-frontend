'use strict';

/* export DAQI, getDAQIStatus */

/**
 * This DAQI utility defines the flag icon and banding for 5 different status,
 * from good, moderate, high to extreme, and invalid.
 */

(function(exports){

  var DAQI = {
    low: {
      iconURL: 'images/green_flag.png',
      banding: 'Good'
    },
    moderate: {
      iconURL: 'images/yellow_flag.png',
      banding: 'Moderate'
    },
    high: {
      iconURL: 'images/red_flag.png',
      banding: 'Unhealthy'
    },
    extreme: {
      iconURL: 'images/purple_flag.png',
      banding: 'Very Unhealthy'
    },
    invalid: {
      iconURL: 'images/gray_flag.png',
      banding: 'Invalid'
    }
  };

  function getDAQIStatus(index) {
    if (!Number.isInteger(index) || index < 0) {
      return 'invalid';
    } else if (index <= 35) {
      return 'low';
    } else if (index <= 53) {
      return 'moderate';
    } else if (index <= 70) {
      return 'high';
    } else {
      return 'extreme';
    }
  }

  exports.DAQI = Object.freeze(DAQI);
  exports.getDAQIStatus = getDAQIStatus;

})(window);
