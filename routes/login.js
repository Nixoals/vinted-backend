const express = require('express');
const sha256 = require('crypto-js/sha256');
const base64 = require('crypto-js/enc-base64');

const User = require('../models/User');
const router = express.Router();

const generateHash = (password, salt) => {
	const hash = sha256(password + salt).toString(base64);
	// const token = uid2(64).toString(base64);
	result = { hash, salt };
	return result;
};

router.post('/user/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const findUser = await User.findOne({
			email,
		});
		if (findUser) {
			const salt = findUser.salt;
			const checkPass = generateHash(password, salt);
			if (checkPass.hash === findUser.hash) {
				return res.status(200).json({
					token: findUser.token,
					account: findUser.account,
					id: findUser._id,
				});
			} else {
				return res.status(401).json({ message: `Failed to authenticate. Username Or password inccorect` });
			}
		} else {
			return res.status(401).json({ message: `Failed to authenticate. Username Or password inccorect` });
		}
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
});

module.exports = router;
