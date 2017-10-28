'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Attendance = new Schema({
	user_id: Schema.Types.ObjectId,
	location_id: String,
	date: String
});

module.exports = mongoose.model('Attendance', Attendance);
