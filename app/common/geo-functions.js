"use strict"

var request = require("request");

var geoUrl = "http://ip-api.com/json";

module.exports = {
    getClientLocation: function(clientIp, callback) {
        var url = geoUrl + "/" + clientIp;
        request.get(url, function(err, response, body) {
            if (err) return callback(err);
            if (response.statusCode != 200) {
                return callback(body);
            }
            var resultObject = JSON.parse(body);
            if (!resultObject || resultObject.status == 'fail') {
                return callback("location not found");
            }
            callback(resultObject);
        });
    }
}
