var Router = require('diet-router')
var controller = require('../controller')

var router = Router()

// return the status of a module
router.get('/status', function ($) {
	$.data = controller.getStatus($.query.module)
	$.json()
	$.end()
})

// shut down a module
router.post('/shutdown', function ($) {
	controller.shutdown($.body.module).then(() => {
		return 'offline'
	}).catch(err => {
		console.error(err)
		return {
			status: 'disconnected',
			message: 'Couldn\'t shut down. Something is wrong.',
		}
	}).then(data => {
		$.data = data
		$.json()
		$.end()
	})
})

// start up a module
router.post('/startup', function ($) {
	controller.startup($.body.module).then(() => {
		return 'online'
	}).catch(err => {
		console.error(err)
		return {
			status: 'offline',
			message: 'Couldn\'t start the module: ' + err.message,
		}
	}).then(data => {
		$.data = data
		$.json()
		$.end()
	})
})

// shutdown, startup
router.post('/restart', function ($) {
	controller.shutdown($.body.module).catch(err => {
		console.error(err)
		return Promise.reject({
			status: 'disconnected',
			message: 'Couldn\'t shut down. Something is wrong.',
		})
	}).then(() => {
		return controller.startup($.body.module).catch(err => {
			console.error(err)
			// rethrow the error to be caught below
			throw err
		})
	}).then(() => {
		return 'online'
	}).catch(err => {
		if (err instanceof Error) {
			console.error(err)
			return {
				status: 'offline',
				message: 'Couldn\'t start the module: ' + err.message,
			}
		}
		// otherwise it's the error from shutting down
		return err
	}).then(data => {
		$.data = data
		$.json()
		$.end()
	})
})

// start all the modules
// i don't think we need this route any more now that creating a new host automatically starts it
router.get('/inithosts', function ($) {
	controller.initHosts().then(results => {
		// results is an array that will contain only undefined if all startups succeeded
		// and String errors for any modules that did not succeed
		let errors = ''
		for (const error of results) {
			// error will usually be undefined
			if (error) {
				errors += error + '\n'
			}
		}
		if (errors === '') {
			return 'Started all hosts'
		}
		return errors
	}).catch(err => {
		// it shouldn't be possible for an error to occur here but better safe than sorry
		return err.name + ': ' + err.message
	}).then(data => {
		$.data = data
		$.json()
		$.end()
	})
})

module.exports = router
