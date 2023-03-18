const express = require('express');
const stripe = require('stripe')(process.env.SK_STRIPE);
const isAuthenticated = require('../middlewares/isAuthenticated');

const Offer = require('../models/Offer');

const router = express.Router();

router.post('/pay', isAuthenticated, async (req, res) => {
	try {
		console.log(req.body);
		const { id, stripeToken } = req.body;
		const offer = await Offer.findById(id);

		const { product_price, product_name } = offer;

		const totalPrice = (Number(product_price) + 3) * 100;

		console.log(totalPrice, product_name);
		const response = await stripe.charges.create({
			amount: totalPrice,
			currency: 'eur',
			description: product_name,
			source: stripeToken,
		});
		console.log(response.status);
		if (response.status === 'succeeded') {
			offer.sold = true;
			await offer.save();

			res.status(200).json({ status: response.status, offer });
		}
	} catch (error) {
		res.status(400).json({ message: 'here' });
	}
});

module.exports = router;
