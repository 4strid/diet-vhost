const ko = require('nekodb')
const bcrypt = require('bcrypt')

function searchname (username) {
	return username.replace(/[_ ]/g, '-').toLowerCase()
}

const User = ko.Model('User', {
	username: ko.String.match(/^[a-zA-Z0-9_\-\.~[\]@!$'()\*+;,= ]{2,20}$/),
	searchname: ko.String.range(2, 20),
	email: ko.Email.optional(),
	password: ko.String.minlength(8),
	admin: ko.Boolean.default(false),
	$$hooks: {
		prevalidate (instance, next) {
			instance.searchname = searchname(instance.username)
			instance.email = instance.email ? instance.email.toLowerCase() : null
			next()
		},
		presave: {
			password (instance, next) {
				bcrypt.hash(instance.password, parseInt(process.env.CTRL_PANEL__SALTROUNDS),
				(err, hash) => {
					if (err) {
						return next(err)
					}
					instance.password = hash
					next()
				})
			},
		},
	},
	$$indices: {
		username: {
			unique: true,
		},
		searchname: {
			unique: true,
		},
	},
})

User.authenticate = function (username, password, cb) {
	User.findOne({searchname: searchname(username)}).then(user => {
		if (user === null) {
			return cb(null, null)
		}
		bcrypt.compare(password, user.password, (err, authenticated) => {
			if (err) {
				return cb(err, null)
			}
			if (authenticated) {
				return cb(null, user)
			}
		})
	}).catch(err => {
		return cb(err, null)
	})
}

User.getUser = function (username) {
	return User.findOne({searchname: searchname(username)})
}

User.deleteUser = function (username) {
	return User.deleteOne({searchname: searchname(username)})
}

module.exports = User
