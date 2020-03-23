const express = require('express');
const router = express.Router();
const Record = require('../models/record');
const User = require('../models/user');
const arrayCountries = require('../bin/countrie');
const arrayProfession = require('../bin/profession');
const fs = require('fs');
const bcryptSalt = 10;
const path = require('path');
const routeAvatarPictures = '../images/profileimages/';
const multer = require('multer');
const storage = multer.diskStorage({
	destination: function (req, file, callback) {
		callback(null, './public/images/profileimages');
	},
	filename: function (req, file, callback) {

		callback(null, 'AvatarImage' + Date.now() + path.extname(file.originalname));
	}
});

var upload = multer({ storage: storage }).single('pictureOfUser');


/* GET home page */
router.get('/', (req, res, next) => {
	res.render('./record/index');
});

router.get('/wall', (req, res) => {
	Record.find({}).populate('owner').sort({ createdAt: -1 })
		.then((result) => {
			res.render('./private/wall', { result });
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
		.catch(() => res.render('private/add-comment', { errorMessage: 'Ops. Something went wrong with your publications. Try again' }))
});


router.get('/record/like/:id', async (req, res, next) => {
	const currentUserId = req.session.currentUser._id;
	const recordId = req.params.id;
	const record = await Record.findById(recordId);
	if (!record.like.includes(currentUserId)) {
		record.like.push(currentUserId);
		await record.save();
	}
	res.redirect('/private/wall');
});

router.get('/edit', (req, res, next) => {
	console.log(req.session.currentUser._id)
	User.findById(req.session.currentUser._id).then(response => {

		let { username, name, lastName, password: hashPass, email, profession, country, pictureOfUser, birthday } = response
		stringBirthday = new Date(birthday);
		stringBirthday = stringBirthday.getFullYear().toString() + '-' + (stringBirthday.getMonth() + 1).toString().padStart(2, 0) + '-' + stringBirthday.getDate().toString().padStart(2, 0);
		let objectProfession = findSelectedInArray(arrayProfession, profession);
		let objectCountries = findSelectedInArray(arrayCountries, country);
		res.render('private/edituser', { job: objectProfession, countries: objectCountries, username, name, lastName, password: hashPass, email, profession, country, pictureOfUser, stringBirthday });


	})

});


router.post('/uploadAvatar', (req, res, next) => {
	//upload picture
	upload(req, res, function (err) {
		if (err) {
			return request.end('Error uploading file.');
		}
		let actualPictureName;
		console.log(req.session.currentUser.email);
		User.findById(req.session.currentUser._id)
			.then(response => actualPictureName = response.pictureOfUser);
		User.findByIdAndUpdate(req.session.currentUser._id, { pictureOfUser: req.file.filename })
			.then((respuesta) => {
				if (actualPictureName !== 'default.png') {
					fs.unlinkSync(path.join(__dirname, '/../', '/public/images/profileimages/', actualPictureName));
				}
				req.session.currentUser = respuesta;
				res.redirect('edit');
			}
			)
	});


});
router.post('/edit', (req, res, next) => {

	User.findById(req.session.currentUser._id).then(response => {

		let { username, name, lastName, password, repeatPassword, profession, country, birthday } = req.body
		if (username != '') {
			response.username = username;
		}
		if (name != '') {
			response.name = name;
		}
		if (lastName != '') {

			response.lastName = lastName;
		}
		response.profession = profession;
		response.country = country;
		response.birthday = new Date(birthday);
		if (password != '' && repeatPassword === password && regexPassword.test(password)) {
			const salt = bcrypt.genSaltSync(bcryptSalt);
			response.password = bcrypt.hashSync(password, salt);
		} else {
			if (password != '') {
				console.log('fallo al cambiar el password');
				res.render('auth/edituser', response);
			}
		}
		User.findByIdAndUpdate(req.session.currentUser._id, response)
			.then((respuesta) => {
				req.session.currentUser = respuesta
				console.log('User updated');
				res.redirect('/private/edit')
			})
	})
})


function findSelectedInArray(array, selection) {
	let arrayObjects = []
	array.map(function (element) {
		if (element == selection) {
			arrayObjects.push({ element: element, status: true })
		} else {
			arrayObjects.push({ element: element, status: '' })
		}
	})
	return arrayObjects
}



module.exports = router;
