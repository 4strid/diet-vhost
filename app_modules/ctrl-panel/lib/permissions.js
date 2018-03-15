const User = require('./models/user')
const Host = require('./models/host')

function checkAdmin (username) {
	return User.getUser(username).then(user => {
		return !!user.admin
	})
}

module.exports = {
	isAdmin ($) {
		checkAdmin($.user.username).then(isAdmin => {
			if (isAdmin) {
				return $.return()
			}
			$.status('403')
			$.end()
		}).catch($.err)
	},
	hasPermission ($) {
		checkAdmin($.user.username).then(isAdmin => {
			if (isAdmin) {
				return $.return()
			}
			let module
			if ($.query && $.query.module) {
				module = $.query.module
			} else if ($.body && $.body.module) {
				module = $.body.module
			} else if ($.params && $.params.module) {
				module = $.params.module
			}
			if (module) {
				return Host.findOne({module: module}).then(host => {
					if (host === null || host.admin !== $.user.username) {
						$.status('403')
						return $.end()
					}
					return $.return()
				})
			}
			if ($.params.username === $.user.username) {
				return $.return()
			}
			$.status('403')
			$.end()
		}).catch($.err)
	},
}
