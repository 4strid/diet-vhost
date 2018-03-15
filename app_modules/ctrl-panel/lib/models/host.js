const ko = require('nekodb')

const envKey = require('../envkey')

const Host = ko.Model('Host', {
	module: ko.String,
	hostname: ko.URL,
	admin: ko.String,
	env: [{
		key: ko.String,
		value: ko.String,
	}],
	$$indices: {
		hostname: {
			unique: true,
		},
		module: {
			unique: true,
		},
	},
	$$hooks: {
		oncreate: function (instance, next) {
			if (!/(http:\/\/|https:\/\/)/.test(instance.hostname)) {
				instance.hostname = 'http://' + instance.hostname
			}
			instance.env.push({
				key: envKey(instance.module + '__HOSTNAME'),
				value: instance.hostname,
			})
			next()
		},
	},
})

module.exports = Host
