var Router = require('diet-router')
// const auth = require('diet-auth')({authenticate: users.authenticate})

var User = require('../models/user')
const Host = require('../models/host')
var auth = require('../auth')({authenticate: User.authenticate})

var router = Router()

router.get('/login', function ($) {
	if ($.user) {
		$.redirect('/')
		return $.end()
	}
	$.data.failedLogin = $.session.failedLogin
	$.session.failedLogin = undefined
	$.data.loggedOut = $.session.loggedOut
	$.session.loggedOut = undefined
	$.html('login')
	$.end()
})
router.post('/login', auth.login)
router.get('/logout', auth.logout)

router.get('/', auth.ensureLoggedIn, function ($) {
	$.data.user = $.user
	const query = $.user.admin ? {} : {admin: $.user.username}
	Host.find(query).then(hosts => {
		$.data.managedHosts = hosts.map(host => {
			return {
				module: host.module,
				hostname: host.hostname.replace(/(http:\/\/|https:\/\/)/, ''),
			}
		})
		$.html('ctrlpanel')
		$.end()
	}).catch($.err)
})

module.exports = router
