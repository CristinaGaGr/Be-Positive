const express = require('express');
const router = express.Router();
const Record = require('../models/record');

/* GET home page */
router.get('/', (req, res, next) => {
	res.render('./record/index');
});

router.get('/wall', (req, res) => {
	Record.find({}).populate('owner').sort({createdAt: -1})
		.then((result) => {
			res.render('./private/wall', {result});
		})
		.catch(error => {
			console.error('Error while publishing your comment', error);
		})
});


router.get('/profile', (req, res) => {
	res.render('private/profile');
});


router.get('/add-comment', (req, res) => {
	res.render('private/add-comment');
});


router.post('/add-comment', (req, res, next) => {
	const record = {
		text: req.body.text,
		owner: req.session.currentUser._id
	};
	Record.create(record)
		.then(() => {
			res.redirect('./wall');
		})
		.catch(() => res.render('private/add-comment', {errorMessage: 'Ops. Something went wrong with your publications. Try again'}))
});


module.exports = router;
