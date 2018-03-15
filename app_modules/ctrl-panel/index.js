const server = require('diet')


const logger       = require('morgan')
const session      = require('express-session')
const SessionStore = require('express-nedb-session')(session)
const compatible   = require('diet-connect')
const Router       = require('diet-router')
const ect          = require('diet-ect-fix')
const static_      = require('diet-static')
const serverError  = require('diet-500')
const ko = require('nekodb')

// main
const app = server()

ko.connect({
	client: 'nedb',
	filepath: __dirname + '/db',
})

app.initHosts = require('./lib/controller').initHosts

if (process.env.CTRL_PANEL__HOSTNAME) {
	const auth        = require('./lib/auth')({})
	const permissions = require('./lib/permissions.js')

	app.listen(process.env.CTRL_PANEL__HOSTNAME)

	app.header(serverError)

	app.header(compatible(logger('dev')))

	app.header(compatible(session({
		secret: process.env.CTRL_PANEL__SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: (365 * 24 * 3600 * 1000) / 2 },
		store: new SessionStore({filename: app.path + '/db/session.db'}),
	})))

	app.header(ect({path: app.path + '/views'}))

	app.header(auth.session)

	app.footer(static_({path: app.path + '/static'}))

	Router.extend(app)


	const root   = require('./lib/routes/root')
	const ctrl   = require('./lib/routes/ctrl')
	const api    = require('./lib/routes/api')
	const manage = require('./lib/routes/manage')


	// login, logout, and /
	app.route('', root)
	// control routes
	app.route('/ctrl', auth.isLoggedIn, permissions.hasPermission, ctrl)
	// api routes
	app.route('/api', auth.isLoggedIn, permissions.hasPermission, api)
	// manage lists of users / hosts
	app.route('/manage', auth.ensureLoggedIn, manage)
}
module.exports = app
