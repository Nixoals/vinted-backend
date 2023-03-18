const express = require('express');
const fileUpload = require('express-fileupload');
const uid2 = require('uid2');
const sha256 = require('crypto-js/sha256');
const base64 = require('crypto-js/enc-base64');

const User = require('../models/User');
const router = express.Router();

const cloudinary = require('cloudinary').v2;

const generateHash = (password) => {
	const salt = uid2(16);
	const hash = sha256(password + salt).toString(base64);
	const token = uid2(64).toString(base64);
	result = { hash, token, salt };
	return result;
};

const convertToBase64 = (file) => {
	return `data:${file.mimetype};base64,${file.data.toString('base64')}`;
};

router.post('/user/signup', fileUpload(), async (req, res) => {
	try {
		const { username, email, password, newsletter } = req.body;

		const findUser = await User.findOne({
			email: email,
		});

		if (findUser) {
			return res.status(401).json({
				message: `User already exist`,
			});
		}
		if (!username || !email || !password) {
			return res.status(401).json({
				message: `fill the resquired form`,
			});
		}

		let secure_url;
		const picture = req.files?.avatar;

		if (!picture) {
			secure_url = 'https://res.cloudinary.com/dbrbme99g/image/upload/v1668094806/vinted/avatar/defaultAvatar_h8z2jx.png';
		} else {
			const convertedPicture = convertToBase64(picture);
			const result = await cloudinary.uploader.upload(convertedPicture, { folder: '/vinted/avatar' });
			secure_url = result.secure_url;
		}

		const data = generateHash(password);
		const newUser = new User({
			email,
			account: { username, avatar: secure_url },
			newsletter,
			salt: data.salt,
			hash: data.hash,
			token: data.token,
		});

		await newUser.save();
		res.status(200).json({
			_id: newUser._id,
			account: { username: username, avatar: secure_url },
			token: data.token,
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
});

module.exports = router;
