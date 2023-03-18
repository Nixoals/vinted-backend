const mongoose = require('mongoose');

const User = mongoose.model('User', {
	email: { type: String },
	account: {
		username: { type: String },
		avatar: { type: Object },
	},
	newsletter: { type: Boolean },
	hash: { type: String },
	token: { type: String },
	salt: { type: String },
});

module.exports = User;
