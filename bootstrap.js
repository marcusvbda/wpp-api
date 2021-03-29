const moduleAlias = require('module-alias')
moduleAlias.addAliases({
	'@root': __dirname,
	'@src': __dirname + '/src',
	'@routes': __dirname + '/src/routes',
	'@middlewares': __dirname + '/src/middlewares',
})
require('dotenv').config()