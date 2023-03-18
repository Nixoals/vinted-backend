const mongoose = require('mongoose');

const Offer = mongoose.model('Offer', {
	product_name: { type: String },
	product_description: { type: String },
	product_price: { type: Number },
	product_details: { type: Array },
	product_image: { type: Object },
	sold: { type: Boolean },
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
	},
});

module.exports = Offer;
