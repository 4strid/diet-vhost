/*
 * cutesrv 0.0.1
 *
 * includes each hostname as its own module
 * each host module creates its own app and runs completely independently of the others
 * they all share one instance of Diet and can all listen on port 80.
 */

const modules = require('./modules')

modules['ctrl-panel'] = {
	module: 'ctrl-panel',
	app: require('./app_modules/ctrl-panel'),
	status: 'online',
}

modules['ctrl-panel'].app.initHosts()
