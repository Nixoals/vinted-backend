const express = require('express');
const fileUpload = require('express-fileupload');
const router = express.Router();

const convertToBase64 = require('../functions/convertToBase64');

const isAuthenticated = require('../middlewares/isAuthenticated');
const Offer = require('../models/Offer');

const cloudinary = require('cloudinary').v2;

router.post('/offer/publish', isAuthenticated, fileUpload(), async (req, res) => {
	try {
		//extract data
		const { title, description, price, condition, city, brand, size, color } = req.body;
		console.log(title, description, price, condition, city, brand, size, color);
		if (description.length > 500) {
			return res.status(400).json({
				message: "Description product should'nt exceed 500 chars",
			});
		} else if (title.length > 50) {
			return res.status(400).json({
				message: "Title product should'nt exceed 50 chars",
			});
		} else if (price > 100000) {
			return res.status(400).json({
				message: `Comme on! ${price} box for a product on vintacteur is 24% overpaid`,
			});
		}

		const user = req.user;

		const newOffer = new Offer({
			product_name: title,
			product_description: description,
			product_price: price,
			product_details: [{ Marque: brand }, { TAILLE: size }, { État: condition }, { COULEUR: color }, { EMPLACEMENT: city }],
			owner: {
				_id: user._id,
			},
			product_image: {
				secure_url: '',
			},
		});
		console.log(req.files.picture);
		if (req.files?.picture) {
			const picture = req.files.picture;

			const convertedPicture = convertToBase64(picture);
			const result = await cloudinary.uploader.upload(convertedPicture, {
				folder: '/vinted/offers',
				overwrite: true,
				public_id: newOffer._id,
				use_filename: true,
			});
			newOffer.product_image.secure_url = result.secure_url;
		}

		await newOffer.save();
		const offer = await Offer.findById(newOffer._id).populate('owner', 'account');
		res.json(offer);
	} catch (error) {
		res.status(400).json({
			message: `${error.message}`,
		});
	}
});

router.delete('/offer/delete', isAuthenticated, fileUpload(), async (req, res) => {
	try {
		const id = req.body.id;
		const offerToDelete = await Offer.findByIdAndDelete(id);
		console.log(id);
		const destroyImage = await cloudinary.uploader.destroy(id);
		console.log(destroyImage);
		res.status(200).json({
			message: `Offer n°${id} has been successfully deleted`,
		});
	} catch (error) {
		res.status(400).json({
			message: `${error.message}`,
		});
	}
});

router.put('/offer/update', isAuthenticated, fileUpload(), async (req, res) => {
	try {
		const id = req.body.id;
		console.log();
		const offerToModify = await Offer.findById(id);
		const { title, description, price, condition, city, brand, size, color } = req.body;
		console.log(offerToModify);

		offerToModify.product_name = title;
		offerToModify.product_description = description;
		offerToModify.product_price = price;
		offerToModify.product_details = [{ Marque: brand }, { TAILLE: size }, { État: condition }, { COULEUR: color }, { EMPLACEMENT: city }];

		await offerToModify.save();
		console.log(offerToModify);
		res.json({
			_id: offerToModify._id,
			product_name: title,
			product_description: description,
			product_price: price,
			product_details: [{ Marque: brand }, { TAILLE: size }, { État: condition }, { COULEUR: color }, { EMPLACEMENT: city }],
			owner: {
				_id: offerToModify.owner._id,
				account: offerToModify.owner.account,
			},
			product_image: {
				secure_url: offerToModify.product_image.secure_url,
			},
		});
	} catch (error) {
		res.status(400).json({
			message: `${error.message}`,
		});
	}
});

router.get('/offer', async (req, res) => {
	try {
		const { title, priceMin, priceMax, sort, page, resultNumber } = req.query;
		let regExp = null;
		let sortBy;
		let skip = 0;
		let maxResultPerPage = resultNumber; //default all
		console.log(title, priceMin);
		if (title) {
			regExp = new RegExp(title, 'i');
		} else {
			regExp = new RegExp('', 'i');
		}
		if (priceMin && priceMax) {
			priceRange = { $gte: priceMin, $lte: priceMax };
		} else if (priceMin) {
			priceRange = { $gte: priceMin };
		} else if (priceMax) {
			priceRange = { $lte: priceMax };
		} else {
			priceRange = { $lte: 10 ** 5 };
		}
		if (sort) {
			if (sort === 'price-desc') {
				sortBy = { product_price: -1 };
			} else if (sort === 'price-asc') {
				sortBy = { product_price: 1 };
			}
		}
		if (page && page > 1) {
			skip = maxResultPerPage * page - maxResultPerPage;
		}
		const searchResult = await Offer.find({ product_name: regExp, product_price: priceRange }).skip(skip).sort(sortBy).limit(maxResultPerPage).populate('owner', 'account');
		const lengthSearchResult = await Offer.count({ product_name: regExp, product_price: priceRange });
		res.status(200).json({
			count: lengthSearchResult,
			offers: searchResult,
		});
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
});

router.get('/offer/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const findOffer = await Offer.findById(id).populate('owner', 'account');
		res.json(findOffer);
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
});

router.post('/offer/publish-test', fileUpload(), async (req, res) => {
	try {
		const picture = req.files?.picture;
		console.log(req.body, picture);
		res.json(picture);
	} catch (error) {
		res.status(400).json({
			message: error.message,
		});
	}
});

module.exports = router;
