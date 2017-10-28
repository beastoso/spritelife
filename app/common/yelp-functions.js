"use strict"

var request = require("request");

var yelpUrl = "https://api.yelp.com/v3/businesses/search?term=bar&";
var yelpAuthUrl = "https://api.yelp.com/oauth2/token";

var configAuth = require('../config/auth');

var self = module.exports = {
    getAccessToken: function(callback) {
        var formData = {
            grant_type: 'client_credentials',
            client_id: configAuth.yelpAuth.clientID,
            client_secret: configAuth.yelpAuth.clientSecret
        }
        
        request.post({
            url: yelpAuthUrl,
            form: formData
        }, function(err, response, body){
            if (err) {
                callback(err);
            }
            else if (response.statusCode != 200) {
                callback(body)
            }
            else {
                var responseObj = JSON.parse(body);
                callback(null, responseObj.access_token);
            }
        });
    },
    getAttractionsNearby: function(locationData, callback) {
        var url = yelpUrl;
        if (locationData.lat && locationData.lon) {
            url += "ll="+locationData.lat + "," + locationData.lon;
        }
        else {
            url += "location="+locationData;
        }
        
        self.getAccessToken(function(err, token) {
            if (err) return callback(err);
            
            request.get(url, {auth: {bearer: token}}, function (error, response, body) {
                if (error) {
                    return callback(error);
                }
                else if (response.statusCode != 200) {
                    return callback(body);
                }
                
                var resultObject = JSON.parse(body);
                if (!resultObject || resultObject.total == 0) {
                    return callback("no bars to be found here");
                }
                callback(null, resultObject.businesses);
      
            });
        });
    }
};