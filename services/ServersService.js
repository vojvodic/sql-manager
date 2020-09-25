const path = require('path')
const fs = require('fs')

module.exports = class ServersService {

  constructor() {
	this.jsonFilePath = '../storage/db/servers.json';
	this.setServers();
  }

  getServers() {
	return this.servers;
  }

  setServers() {
	if ( !fs.existsSync(path.join(__dirname, this.jsonFilePath)) ) {
	  this.servers = [];
	} else {
	  this.servers = JSON.parse( fs.readFileSync(path.join(__dirname, this.jsonFilePath)) );
	}
  }

  createServer(server) {
	this.validateServer(server);
	server.server_id = Math.random().toString(15).substring(5);
	this.servers.push(server);
	try {
	  this.store();
	} catch (error) {
	  return Promise.reject(error);
	}
	return Promise.resolve(server);
  }

  updateServer(server_id,server) {
	for (var i = 0; i < this.servers.length; i++) {
	  if (server_id == this.servers[i]['server_id']) {
		this.validateServer(server);
		server.server_id = this.servers[i].server_id;
		this.servers[i] = server;
		try {
		  this.store();
		} catch (error) {
		  return Promise.reject(error);
		}
		return Promise.resolve(this.servers[i]);
	  }
	}
	return Promise.reject({ status: 404, message: 'Server not found' });
  }

  deleteServer(server_id) {
	let server_index = null;
	for (var i = 0; i < this.servers.length; i++) {
	  if (server_id == this.servers[i]['server_id']) {
		this.servers.splice(i,1);
		try {
		  this.store();
		} catch (error) {
		  return Promise.reject(error);
		}
		return Promise.resolve(this.servers);
	  }
	}
	return Promise.reject({ status: 404, message: 'Server not found' });
  }

  validateServer(server) {
	let data = new Array('driver','host','port','user','database');
	for (var i = 0; i < data.length; i++) {
	  if (!server[data[i]]) {
		// Database is not required when driver is mysql
		if (data[i] == 'database' && server.driver == 'mysql') {
		  continue;
		}
		let niceName = data[i].charAt(0).toUpperCase() + data[i].slice(1);
		throw { status: 400, message: niceName + ' is required!' };
		return false;
	  }
	}
	return true;
  }

  store() {
	fs.writeFileSync(path.join(__dirname, this.jsonFilePath), JSON.stringify(this.servers), function (error) {
	  if (error) throw error;
	});
  }
}
