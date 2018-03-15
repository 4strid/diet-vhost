const decache = require('decache')

const Host = require('./models/host')
const modules = require('../../../modules')

function lookup (module) {
	return modules[module]
}

function getStatus (module) {
	return modules[module].status
}

function shutdown (module) {
	// host.app.hosts is actually Diet's hosts object
	// loop through the hosts because they might be listening
	// on localhost or something; we don't know the hostname for sure
	return new Promise((resolve, reject) => {
		const host = lookup(module)
		try {
			for (const h in host.app.hosts) {
				if (host.app.hosts[h] === host.app) {
					// remove the app
					host.app.hosts[h] = undefined
				}
			}
			host.app = undefined
			host.status = 'offline'
			// this is *pretty* hacky, but we don't want to lose diet or the modules object when
			// decaching the module so we hold onto them here and restore them below
			const diet = require.cache[require.resolve('diet')]
			const modules = require.cache[require.resolve('../../../modules')]
			// unrequire the module
			decache('../../' + module)
			// restore saved modules
			require.cache[require.resolve('diet')] = diet
			require.cache[require.resolve('../../../modules')] = modules
			// sometimes I run into errors shutting down / starting up too close together
			// this gives us some breathing room
			setTimeout(() => {
				resolve()
			}, 100)
		} catch (err) {
			host.app = undefined
			host.status = 'offline'
			reject(err)
		}
	})
}

function startup (module) {
	const host = typeof module === 'string' ? lookup(module) : module
	if (host.status === 'online') {
		return Promise.resolve()
	}
	return Host.findOne({module: host.module}).then(hostModel => {
		for (const variable of hostModel.env) {
			process.env[variable.key] = variable.value
		}
		host.app = require('../../' + host.module)
		host.status = 'online'
	})
}

function initHost (hostModel) {
	const host = modules[hostModel.module] = {
		module: hostModel.module,
		status: 'offline',
	}
	return startup(host).catch(err => {
		// we catch the error here because we want to start as many of the hosts as possible
		console.error('Couldn\'t load module: ' + host.module)
		console.error(err.name + ': ' + err.message)
		// add an error to the Promise.all array
		return 'Failed to start ' + host.module
	})
}

// get all the hosts from the database and attempt to load them
function initHosts () {
	return Host.find({}).then(hosts => {
		const startups = []
		for (const h of hosts) {
			if (modules[h.module] && modules[h.module].status === 'online') {
				shutdown(h.module).catch(err => {
					console.error(`Couldn't shut down module ${h.module}.
${err.name}: ${err.message}`)
				}).then(() => {
					startups.push(initHost(h))
				})
			} else {
				startups.push(initHost(h))
			}
		}
		return Promise.all(startups)
	})
}

module.exports = {
	lookup,
	getStatus,
	shutdown,
	startup,
	initHost,
	initHosts,
}
