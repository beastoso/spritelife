'use strict';


module.exports = {
	'googleAuth': {
		'clientID': process.env.GOOGLE_CLIENT_ID,
		'clientSecret': process.env.GOOGLE_CLIENT_SECRET,
		'callbackURL': process.env.APP_URL + 'auth/google/callback'
	},
	'yelpAuth': {
		'clientID': process.env.YELP_CLIENT_ID,
		'clientSecret': process.env.YELP_CLIENT_SECRET
	}
};
