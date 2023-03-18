const express = require('express');

const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
	try {
		if (!req.headers.authorization) {
			res.status(401).json({
				message: 'Unauthorized',
			});
		}
		const token = req.headers.authorization.replace('Bearer ', '');
		const user = await User.findOne({ token: token }).select('account');

		if (user === null) {
			return res.status(401).json({
				message: 'Unauthorized',
			});
		}

		req.user = user;
		next();
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
};

module.exports = isAuthenticated;
