const express = require('express')
const router = express.Router()

const preferencesService = require('./services/PreferencesService')
const serversService = require('./services/ServersService')
const settingsService = require('./services/SettingsService')
const sqlHistoryService = require('./services/SQLHistoryService')
const sqlService = require('./services/SQLService');
const saveResultsService = require('./services/SaveResultsService');

/*
 * Send Main file on inital window load
 */
router.get('/', function(request, response) {
  response.sendFile( path.join(__dirname, 'public/index.html') );
});

/*
 * Start App - Main file is loaded and Vue is ready at this stage
 */
router.get('/start', function(request, response) {
  response.json({
	servers: (new serversService).getServers(),
	settings: (new settingsService).getSettings(),
	preferences: (new preferencesService).getPreferences()
  });
});

// Return all servers
router.get('/servers', function(request, response) {
  response.json({
	servers: (new serversService).getServers(),
  });
});

// Create server
router.post('/servers', function(request, response, next) {
  (new serversService).createServer(request.body)
					  .then(server => {
						 response.json({ 'server' : server });
					  }).catch(next);
});

// Update server
router.put('/servers/:server_id', function(request, response, next) {
  (new serversService).updateServer(request.params.server_id, request.body)
					  .then(server => {
						 response.json({ 'server' : server });
					   }).catch(next);
});

// Delete server
router.delete('/servers/:server_id', function(request, response, next) {
  (new serversService).deleteServer(request.params.server_id, request.body)
					  .then(servers => {
						 (new sqlHistoryService).deleteSQLHistory(request.params.server_id);
						 response.json({ 'servers' : servers });
					   }).catch(next);
});

// Return all server sql history
router.get('/servers/:server_id/sql-history', function(request, response, next) {
  response.json({
	history: (new sqlHistoryService).getSQLHistory(request.params.server_id)
  });
});

// Delete all server sql history
router.delete('/servers/:server_id/sql-history', function(request, response, next) {
  (new sqlHistoryService).deleteSQLHistory(request.params.server_id)
						 .then(history => {
							response.json({ 'history': history });
						 }).catch(next);
});

// Return all server databases
router.get('/servers/:server_id/databases', function(request, response, next) {
  (new sqlService).setConnection(request.params.server_id)
				  .getDatabases()
				  .then(function(results){
					response.json({ 'databases': results.rows });
				  }).catch(next);
});

// Return all server database tables
router.get('/servers/:server_id/database/:database_name/tables', function(request, response, next) {
  (new sqlService).setConnection(request.params.server_id, request.params.database_name)
				  .getDatabaseTables()
				  .then(function(results){
					response.json({ 'tables': results.rows });
				  }).catch(next);
});

// Return all server database table columns
router.get('/servers/:server_id/database/:database_name/tables/:table_name/columns', function(request, response, next) {
  (new sqlService).setConnection(request.params.server_id, request.params.database_name)
				  .getDatabaseTableColumns(request.params.table_name)
				  .then(function(results){
					response.json({ 'columns': results.rows });
				  }).catch(next);
});

// Return table view definition
router.get('/servers/:server_id/database/:database_name/tables/:table_name/view-definition', function(request, response, next) {
  (new sqlService).setConnection(request.params.server_id, request.params.database_name)
				  .getViewDefinition(request.params.table_name)
				  .then(function(results){
					let viewDefinition = '';
					if (results.rows.length) {
					  viewDefinition = results.rows[0]['view_definition'];
					}
					response.json(viewDefinition);
				  }).catch(next);
});

// Execute server SQL statement
router.post('/servers/:server_id/run-sql', function(request, response, next) {
  (new sqlService).setConnection(request.params.server_id, request.body.database)
				  .setQuery(request.body.query)
				  .runSQL()
				  .then(function(results){
					if(request.body.cacheSQLHistory) {
					  (new sqlHistoryService).saveSQLHistory(request.params.server_id, request.body.database, request.body.query);
					}
					response.json(results);
				  }).catch(next);
});

// Save SQL Results
router.post('/servers/:server_id/run-sql/save-results', function(request, response, next) {
  (new sqlService).setConnection(request.params.server_id, request.body.database)
				  .setQuery(request.body.query)
				  .runSQL()
				  .then(function(results){
					(new saveResultsService).save(request.body.filePath, results.rows)
											.then(function(){
											   // Nothing to return, when file is saved electron will get 200 OK
											   response.json();
											}).catch(next);
				  }).catch(next);
});

// Reset all preferences
router.post('/preferences/reset', function(request, response, next) {
  (new preferencesService).resetPreferences()
						  .then(preferences => {
							 response.json({ 'preferences' : preferences });
						  }).catch(next);
});

// Update preferences
router.post('/preferences/save', function(request, response, next) {
  (new preferencesService).savePreferences(request.body.preferences)
						  .then(preferences => {
							 response.json({ 'preferences' : preferences });
						  }).catch(next);
});

module.exports = router
