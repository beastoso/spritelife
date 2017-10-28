'use strict';

var path = process.cwd();
var DBHelper = require(path + '/app/common/db-functions.js');
var SearchController = require(path + '/app/controllers/searchController.server.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else if (req.session.user) {
			return next();
		} else {
			res.redirect('/login');
		}
	}

	app.route('/')
		.get(function (req, res) {
			res.sendFile(path + '/public/index.html');
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			req.session.user = false;
			res.redirect('/');
		});

	app.route('/api/user')
		.get(function (req, res) {
			if (req.user) {
				req.session.user = req.user;
				res.json(req.user);
			}
			else if (req.session.user) {
				res.json(req.session.user);
			}
			else {
				res.json(false);
			}
		});
		
	app.route('/api/search')
		.get(function(req, res){
			
			var location = req.query.location;
			var limit = req.query.limit;
			var offset = req.query.offset;
			var userId = (req.user ? req.user._id : false);
			var useIp = (req.query.useCurrentLocation == 'true');
			
			limit = (!limit? 10 : Number(limit));
			offset = (!offset? 0 : Number(offset));
					
			var search = function() {
				SearchController.findBars(location, userId, function(err, results) {
					if (err) return res.json(err);
					
					if (results) {
						var i;
						if (offset > results.length) {
							return res.json("no more results");
						}
						var subset = [];
						for (i = offset; i < results.length && i < offset + limit; i++) {
							subset.push(results[i]);
						}
					}
					var data = {
						'data':subset,
						'count':results.length, 
						'offset':offset,
						'search': (useIp ? 'Current location' : location)
					};
					res.json(data);
				});
			};
			
			if (useIp) {
				SearchController.findLocation(req.connection.remoteAddress, function(err, locationData) {
					if (err) return res.json(err);
					
					location = locationData;
					search();
				});
			}
			else if (location == null || location.trim() == "") {
				return res.json(false);
			}
			else {
				search();
			}
			
		});
		
	app.route('/api/going')
		.get(function(req, res){
			if (req.session.user)  {
				DBHelper.getAttendance(req.session.user._id, function(err, attendance) {
					if (err) return res.json("Could not find attendance");
					res.json(attendance);
				});
			}
			else {
				res.json(false);
			}
		});
	app.route('/api/going')
		.post(isLoggedIn, function(req, res){
			if (req.session.user) {
				var locationId = req.body.locationId;
				var isGoing = req.body.going;
				DBHelper.saveAttendance(req.session.user._id, locationId, isGoing, function(err, status) {
					if (err) return res.send("Could not save attendance");
					res.json("success");
				});
			}
			else {
				res.send("not logged in");
			}
		});

	app.route('/auth/google')
		.get(passport.authenticate('google', {
			scope: [
				'https://www.googleapis.com/auth/plus.me',
				'https://www.googleapis.com/auth/userinfo.email'
			]
		}));

	app.route('/auth/google/callback')
		.get(passport.authenticate('google', {
			successRedirect: '/',
			failureRedirect: '/login'
		}));

};
