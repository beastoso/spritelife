'use strict';

var path = process.cwd();
var YelpHelper = require(path + '/app/common/yelp-functions.js');
var GeoHelper = require(path + '/app/common/geo-functions.js');
var DBHelper = require(path + '/app/common/db-functions.js');

module.exports = {
	findLocation: function(requestIp, callback) {
		GeoHelper.getClientLocation(requestIp, function(geoerr, locationData) {
			if (geoerr) return callback(geoerr);
			callback(null, locationData);
        });
	},
    findBars: function(locationData, userId, callback) {
        
		YelpHelper.getAttractionsNearby(locationData, function(yelperr, results) {
			if (yelperr) return callback(yelperr);
			if (!results || results.length == 0) {
				return callback("No bars nearby");
			}
			DBHelper.getAllAttendanceToday(function(err, attendance) {
				results.forEach(function(result){
					result.attendees = 0;
					result.going = false;
					if (err == null && attendance.length > 0) {
						attendance.forEach(function(location){
							if (result.id == location.location_id) {
								result.attendees = location.attendee_count;
							}
						});
					}
				});
				if (userId) {
					DBHelper.getUserAttendance(userId, function(usererr, userAttendance) {
						if (usererr) return callback(usererr);
						results.forEach(function(result){
							userAttendance.forEach(function(location){
								if (result.id == location.location_id) {
									result.going = true;
								}
							});
						});
						callback(null, results);
					});
				}
				else {
					callback(null, results);
				}
			});
			
		});
    }
};