const Router = require('diet-router')

const User = require('../models/user')
const Host = require('../models/host')

const controller = require('../controller')

const router = Router()

function objectize ($) {
	return error => {
		$.status(500)
		if (error instanceof Error) {
			return { error: error.name + ': ' + error.message }
		}
		return { errors: error }
	}
}

function sendData ($) {
	return data => {
		$.data = data
		$.json()
		$.end()
	}
}

router.post('/users/', function ($) {
	const body = JSON.parse($.body)
	User.create(body).save().then(() => {
		return 'Added a new user'
	}).catch(objectize($)).then(sendData($))
})

// updates a user
router.post('/users/:username', function ($) {
	User.getUser($.params.username).then(user => {
		const body = JSON.parse($.body)
		// this is blank by default but we don't want to set the password to ''
		if (body.password === '') {
			delete body.password
		}
		//user.update(body)
		for (const field in body) {
			user[field] = body[field]
		}
		return user.save()
	}).then(() => {
		return 'Updated the user'
	}).catch(objectize($)).then(sendData($))
})

// deletes a user
router.delete('/users/:username', function ($) {
	User.deleteUser($.params.username).then(deletedCount => {
		if (deletedCount === 1) {
			return 'Deleted the user'
		}
		throw new Error('Did not delete the user')
	}).catch(objectize($)).then(sendData($))
})

// creates a new module
router.post('/hosts/', function ($) {
	const body = JSON.parse($.body)
	Host.create(body).save().then(host => {
		return controller.initHost(host, [])
	}).then(error => {
		return error ? error : 'Added the host'
	}).catch(objectize($)).then(sendData($))
})

// updates a module
router.post('/hosts/:module', function ($) {
	const body = JSON.parse($.body)
	Host.findOne({module: $.params.module}).then(host => {
		for (const field in body) {
			host[field] = body[field]
		}
		return host.save()
	}).then(() => {
		return 'Updated the host. You may need to restart it for changes to take effect'
	}).catch(objectize($)).then(sendData($))
})

// shuts down the module and deletes it from the database
router.delete('/hosts/:module', function ($) {
	controller.shutdown($.params.module).then(() => {
		Host.deleteOne({module: $.params.module}).then(deletedCount => {
			if (deletedCount === 1) {
				return 'Deleted the host'
			}
			throw new Error('Did not delete the host')
		}).catch(objectize($)).then(sendData($))
	// error was encountered when shutting down
	}).catch(err => {
		const errorMessage = `Encountered an error,
  ${err.name}: ${err.message}
but still deleted the host`
		// still want to delete it from the database
		Host.deleteOne({module: $.params.module}).then(deletedCount => {
			if (deletedCount === 1) {
				return errorMessage
			}
			throw new Error('Did not delete the host')
		}).catch(objectize($)).then(sendData($))
	})
})

module.exports = router
