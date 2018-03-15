const fs = require('fs')
const path = require('path')

const inquirer = require('inquirer')

inquirer.prompt([{
	type: 'confirm',
	name: 'confirm',
	message: 'Are you sure you want to do this? All users and hosts will be destroyed, and there is no way to recover them\n',
}]).then(answers => {
	if (answers.confirm) {
		fs.unlink(path.join(__dirname, '../db/User.db'), (err) => {
			if (err) {
				console.log('Could not delete Users database')
			}
		})
		fs.unlink(path.join(__dirname, '../db/Host.db'), (err) => {
			if (err) {
				console.log('Could not delete Users database')
			}
		})
		fs.unlink(path.join(__dirname, '../db/session.db'), (err) => {
			if (err) {
				console.log('Could not delete user sessions')
			}
		})
	}
})
