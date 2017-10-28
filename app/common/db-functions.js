"use strict"

var mongo = require("mongodb");
var Attendance = require("../models/attendance");

var self = module.exports = {
    getAttendanceAtLocation: function(locationId, callback) {
        self.getAllAttendanceAtLocationToday(locationId, callback);
    },
    getAllAttendanceToday: function(callback) {
        self.getAllAttendanceAtLocationToday(null, callback);
    },
    getAllAttendanceAtLocationToday: function(locationId, callback) {
        var today = new Date();
        
        var match = {
            'date': today.getYear()+"-"+today.getMonth()+"-"+today.getDate()
        };
        if (locationId != null) {
            match.location_id = locationId;
        }
        Attendance.aggregate([
            {"$match": match },
            {"$group": {'_id':{location_id: '$location_id'}, count: {$sum: 1}} }
        ]).exec(function(error, data) {
          if (error) return callback(error, null);
          var results = [];
          if (data != null) {
            data.forEach(function(record) {
              results.push({
                location_id: record._id.location_id,
                attendee_count: record.count
              });
            });
          }
          callback(null, results);
        });
    },
    saveAttendance: function(userId, locationId, isGoing, callback) {
        var today = new Date();
        var attModel = {
            'user_id': new mongo.ObjectId(userId),
            'location_id': locationId,
            'date': today.getYear()+"-"+today.getMonth()+"-"+today.getDate()
        };
        
        Attendance.findOne(attModel, function(error, results){
            if (error) return callback(error, null);
            if (isGoing) {
                if (!results) {
                    new Attendance(attModel).save(function(error){
                        if (error) return callback(error, null);
                        return callback(null, true);
                    });
                } else {
                    return callback(null, true);
                }
            }
            else if (results){
                results.remove(function(error){
                    if (error) return callback(error, null);
                    return callback(null, true);
                });
            }
            else {
                return callback(null, true);
            }
        });
        
    },
    getUserAttendance: function(userId, callback) {
        var today = new Date();
        
        var matchQuery = {
            'user_id': new mongo.ObjectId(userId),
            'date': today.getYear()+"-"+today.getMonth()+"-"+today.getDate()
        };
        
        Attendance.find(matchQuery, function(error, results){
            if (error) return callback(error, null);
            return callback(null, results);
        });
    }
}