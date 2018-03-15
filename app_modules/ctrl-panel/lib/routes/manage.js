const Router = require('diet-router')

const User = require('../models/user')
const Host = require('../models/host')

const router = Router()

router.get('/users', function ($) {
	const query = $.user.admin ? {} : {username: $.user.username}
	User.find(query).then(users => {
		$.data.users = users
		$.html('users')
		$.end()
	}).catch($.err)
})

router.get('/hosts', function ($) {
	const query = $.user.admin ? {} : {admin: $.user.username}
	Host.find(query).then(hosts => {
		$.data.hosts = hosts.map(host => {
			host.heading = host.hostname.replace(/(http:\/\/|https:\/\/)/, '')
			return host
		})
		$.html('hosts')
		$.end()
	}).catch($.err)
})

module.exports = router
