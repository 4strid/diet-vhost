const inquirer = require('inquirer')
const ko = require('nekodb')

ko.connect({
	client: 'nedb',
	filepath: __dirname + '/../db',
})

const User = require('../lib/models/user')
const Host = require('../lib/models/host')

function userPrompt () {
	return inquirer.prompt([{
		type: 'input',
		name: 'username',
		message: 'Enter a username\n',
		validate: function (username) {
			return /^[a-zA-Z0-9_\-\.~[\]@!$'()\*+;,= ]{2,20}$/.test(username)
		},
	},
	{
		type: 'password',
		name: 'password',
		message: 'Enter a password\n',
		validate: function (password) {
			if (password.length < 8)
				return 'Password must be at least 8 characters long'
			if (!/[a-z]/.test(password))
			   return 'Password must contain at least one lowercase letter'
			if (!/[A-Z]/.test(password)) {
				return 'Password must contain at least one uppercase letter'
			} if (!/\d/.test(password)) {
				return 'Password must contain at least one number'
			}
			return true
		},
	},
	{
		type: 'input',
		name: 'email',
		message: 'Enter an email (optional)\n',
		filter: function (email) {
			if (email === '')
				return undefined
		},
	},
	{
		type: 'input',
		name: 'saltrounds',
		message: 'Enter a number of salt rounds to use when encrypting passwords (somewhere between 12 and 20 is good)\n',
	}]).then(answers => {
		process.env.CTRL_PANEL__SALTROUNDS = answers.saltrounds
		return User.create({
			username: answers.username,
			password: answers.password,
			email: answers.email,
			admin: true,
		}).save().then(ctrlPanelPrompt)
	}).catch(err => {
		console.log('The following fields had errors: ')
		console.log(err)
		return userPrompt()
	})
}

function ctrlPanelPrompt (user) {
	return inquirer.prompt([{
		type: 'input',
		name: 'hostname',
		message: 'Enter the hostname where the control panel will be served (e.g. http://dietvhost.net)\n',
		filter: function (hostname) {
			if (!/(http:\/\/|https:\/\/)/.test(hostname)) {
				return 'http://' + hostname
			}
		},
	}, {
		type: 'input',
		name: 'secret',
		message: 'Enter the secret to use for sessions. Just any old random string will work\n',
	}]).then(answers => {
		return Host.deleteOne({module: 'ctrl-panel'}).then(() => {
			return Host.create({
				module: 'ctrl-panel',
				hostname: answers.hostname,
				admin: user.username,
				env: [{
					key: 'CTRL_PANEL__SALTROUNDS',
					value: process.env.CTRL_PANEL__SALTROUNDS,
				}, {
					key: 'CTRL_PANEL__SESSION_SECRET',
					value: answers.secret,
				}],
			}).save()
		})
	}).catch(err => {
		console.log('The following fields had errors: ')
		console.log(err)
		return ctrlPanelPrompt(user)
	})
}

userPrompt()
