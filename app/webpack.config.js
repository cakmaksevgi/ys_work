let args = require('yargs').argv;
if(args.env === undefined){
	args.env = 'dev';
}
const configurations = require('./.config/webpack.' + args.env + '.config.js');

module.exports = configurations;
