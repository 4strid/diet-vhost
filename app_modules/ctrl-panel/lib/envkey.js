module.exports = function name (source) {
	return source.toUpperCase().replace(/[^0-9A-Z_]/g, '_');
}
