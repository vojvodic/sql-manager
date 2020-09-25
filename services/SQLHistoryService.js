const path = require('path')
const fs = require('fs')

module.exports = class SQLHistoryService {

  constructor() {
	this.jsonFilePath = '../storage/db/sqlhistory.json';
	this.setSQLHistory();
  }

  getSQLHistory(server_id) {
	if (this.sqlHistory[server_id]) {
	  return this.sqlHistory[server_id]
				 .sort(function(a,b){
					return new Date(b.created_at) - new Date(a.created_at);
				 });
	}
	return [];
  }

  setSQLHistory() {
	if ( !fs.existsSync(path.join(__dirname, this.jsonFilePath)) ) {
	  this.sqlHistory = {};
	} else{
	  this.sqlHistory = JSON.parse( fs.readFileSync(path.join(__dirname, this.jsonFilePath)) );
	}
  }

  saveSQLHistory(server_id, database_name = null, sql) {
	if (!this.sqlHistory[server_id]) {
	  this.sqlHistory[server_id] = [];
	}

	let exists = false;
	this.sqlHistory[server_id].forEach((item, i) => {
	  // Already exists
	  if (item.sql == sql) {
		exists = true;
		return;
	  }
	});

	if (!exists) {
	  // Keep max sql history 100 rows per server
	  if (this.sqlHistory[server_id].length >= 100) {
		this.sqlHistory[server_id].splice(100, 1);
	  }
	  this.sqlHistory[server_id].push({ 'sql' : sql, 'database_name' : database_name || '', created_at: new Date().toISOString() });
	  try {
		this.store();
	  } catch (e) {
		return Promise.reject(e);
	  }
	}
	return Promise.resolve(this.sqlHistory[server_id]);
  }

  deleteSQLHistory(server_id = null) {
	if(server_id){
	  if(this.sqlHistory[server_id]){
		delete this.sqlHistory[server_id];
	  }
	} else{
	  this.sqlHistory = {};
	}

	try {
	  this.store();
	} catch (error) {
	  return Promise.reject(error);
	}
	return Promise.resolve(this.sqlHistory);
  }

  store() {
	fs.writeFileSync(path.join(__dirname, this.jsonFilePath), JSON.stringify(this.sqlHistory), function (error) {
	  if (error) throw error;
	});
  }
}
