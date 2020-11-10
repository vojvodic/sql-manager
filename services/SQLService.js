const path = require('path')
const fs = require('fs')
const serversService = require('./ServersService')

module.exports = class SQLService {

  constructor() {
	this.servers = (new serversService).getServers();
  }

  setConnection(server_id, database_name = null) {
	// Pull server connection from servers service based on server_id sent from client
	for (var i = 0; i < this.servers.length; i++) {
	  if (this.servers[i]['server_id'] == server_id) {
		this.server = this.servers[i];
		break;
	  }
	}

	if (!this.server) {
	  throw { status: 404, message: 'Server not found' };
	  return this;
	}

	this.serverConnection = {
	  host: this.server.host,
	  port: this.server.port,
	  user: this.server.user,
	  password: this.server.password
	};

	if (database_name != null) {
	  this.serverConnection.database = database_name;
	}

	// PostgreSQL requires database for connection
	// If serverConnection.database is not set then use database_name from server instance returned from servers service (pgsql server connection must have database name as default)
	if (this.server.driver == 'pgsql' && !this.serverConnection.database) {
	  this.serverConnection.database = this.server.database;
	}

	if (this.server.driver == 'mysql') {
	  this.serverConnection.dateStrings = true; // Return date, timestamp, timestamptz as strings from MySQL DB not java script objects
	  this.serverConnection.supportBigNumbers = true;
	  this.serverConnection.multipleStatements = true;
	  this.connection = require('mysql').createConnection(this.serverConnection);
	} else if (this.server.driver == 'pgsql') {
	  const { Client, types } = require('pg');
	  // Return date, timestamp, timestamptz as strings from PostgreSQL DB not java script objects
	  // Refer to SELECT typname, oid FROM pg_type
	  const oidsToString = [1082,1083,1114,1184];
	  oidsToString.forEach((oid, i) => {
	  	types.setTypeParser(oid, function(value) {
		  return String(value);
	  	});
	  });
	  this.connection = new Client(this.serverConnection);
	}
	return this;
  }

  setQuery(query) {
	this.query = query.trim().replace(/\;+$/,'');
	return this;
  }

  getDatabases() {
	if (this.server.driver == 'mysql') {
	  this.query = `SELECT schema_name AS database_name
					  FROM information_schema.schemata
				  ORDER BY schema_name`;
	} else if (this.server.driver == 'pgsql') {
	  this.query = `SELECT datname AS database_name, datistemplate AS is_template
					  FROM pg_database
				  ORDER BY datname`;
	}
	return this.runSQL();
  }

  getDatabaseTables() {
	if (this.server.driver == 'mysql') {
	  this.query = `SELECT TABLE_NAME AS name,
						   (CASE WHEN TABLE_TYPE = 'BASE TABLE' THEN 'table' ELSE 'view' END) AS type
					  FROM information_schema.TABLES
					 WHERE information_schema.TABLES.TABLE_SCHEMA = '${this.serverConnection.database}'
					   AND information_schema.TABLES.TABLE_TYPE IN ('BASE TABLE','VIEW','SYSTEM VIEW')
				  ORDER BY information_schema.TABLES.TABLE_NAME`;
	} else if (this.server.driver == 'pgsql') {
	  this.query = `SELECT tablename AS name, 'table' AS type
					  FROM pg_catalog.pg_tables
					 WHERE schemaname = 'public'
					 UNION
					SELECT viewname AS name, 'view' AS type
					  FROM pg_catalog.pg_views
					 WHERE schemaname = 'public'
				  ORDER BY name`;
	}
	return this.runSQL();
  }

  getDatabaseTableColumns(table_name) {
	if (this.server.driver == 'mysql') {
	  this.query = `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS data_type
					  FROM information_schema.columns
					 WHERE TABLE_SCHEMA = '${this.serverConnection.database}'
					   AND TABLE_NAME = '${table_name}'`;
	} else if (this.server.driver == 'pgsql') {
	  this.query = `SELECT column_name AS name, data_type
					  FROM information_schema.columns
					 WHERE table_name = '${table_name}'`;
	}
	return this.runSQL();
  }

  getViewDefinition(view_name){
	if (this.server.driver == 'mysql') {
	  this.query = `SELECT VIEW_DEFINITION AS view_definition
					  FROM INFORMATION_SCHEMA.VIEWS
					 WHERE TABLE_SCHEMA = '${this.serverConnection.database}'
					   AND TABLE_NAME   = '${view_name}'
					 LIMIT 1`;
	} else if (this.server.driver == 'pgsql') {
	  this.query = `SELECT definition AS view_definition
					  FROM pg_views
					 WHERE viewname = '${view_name}'
					 LIMIT 1`;
	}
	return this.runSQL();
  }

  runSQL() {
	return new Promise((resolve,reject) => {
	  const preQueryTime = new Date().getTime();
	  if (this.server.driver == 'mysql') {
		try {
		  this.connection.connect();
		} catch (error) {
		  reject(error);
		  return;
		}
		this.connection.query(this.query, (error, responseRows, responseFields) => {
		  this.connection.destroy();
		  if (error) {
			error.status = 400;
			reject( error );
		  } else {
			let lastStatementIndex = null;
			if(responseRows instanceof Array && responseRows.length){
			  responseRows.forEach((statement) => {
				if(statement instanceof Array){
				  lastStatementIndex = responseRows.length - 1;
				  return;
				} else if(statement instanceof Object && statement.hasOwnProperty('affectedRows')) {
				  lastStatementIndex = responseRows.length - 1;
				  return;
				}
			  });
			}

			let rows = lastStatementIndex != null ? responseRows[lastStatementIndex] : responseRows;
			let fields = lastStatementIndex != null ? responseFields[lastStatementIndex] : responseFields;
			let resolved = {};
			resolved['executionTime'] = Number((new Date().getTime() - preQueryTime) / 1000).toFixed(3);
			if (rows instanceof Array) {
			  resolved['rows'] = Object.values(JSON.parse(JSON.stringify(rows)));
			  resolved['fields'] = [];
			  if (fields instanceof Array) {
				Object.values(JSON.parse(JSON.stringify(fields))).forEach((field, i) => {
				  resolved['fields'].push({
					name: field.name,
					dataType: field.type
				  });
				});
			  }
			} else if (rows instanceof Object) {
			  if (rows.hasOwnProperty('affectedRows')) {
				resolved['affectedRows'] = rows.affectedRows;
			  }
			}
			resolve(resolved);
		  }
		});
	  } else if (this.server.driver == 'pgsql') {
		this.connection.connect(function(error){
		  if(error) reject(error);
		});
		this.connection.query(this.query, (error, pgResponse) => {
		  this.connection.end();
		  if (error) {
			error.status = 400;
			reject( error );
		  } else {
			let response = pgResponse instanceof Array ? pgResponse[pgResponse.length - 1] : pgResponse;

			let resolved = {};
			resolved['executionTime'] = Number((new Date().getTime() - preQueryTime) / 1000).toFixed(3);
			if (response.command && ['insert','update','delete'].includes(response.command.toLowerCase())) {
			  resolved['affectedRows'] = response.rowCount;
			} else {
			  resolved['rows'] = response.rows;
			  resolved['fields'] = [];
			  Object.values(JSON.parse(JSON.stringify(response.fields))).forEach((field, i) => {
				resolved['fields'].push({
				  name: field.name,
				  dataType: field.dataTypeID
				});
			  });
			}
			resolve(resolved);
		  }
		});
	  } else {
		let error = {
		  status: 400,
		  message: 'Unknown database driver'
		};
		reject( error );
	  }
	  return;
	});
  }
}
