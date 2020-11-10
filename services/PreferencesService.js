const path = require('path')
const fs = require('fs')

module.exports = class PreferencesService {

  constructor() {
	this.jsonFilePath = '../storage/db/preferences.json';
	this.setPreferences();
  }

  getPreferences() {
	return this.preferences;
  }

  getDefaultPreferences() {
	return {
	  // Left navigation width
	  navigationWidth: 350,

	  // Track user navigation - which servers, databases, columns are active or not
	  navigation: {},

	  // Track opened tabs
	  tabs: {},

	  // Default path for saving files with results
	  saveFileResultsPath: "/results.csv",

	  // Are template databases visible for pgsql driver ?
	  pgsqlShowTemplateDatabases: false,

	  // Are system databases visible for mysql driver (information_schema, performance_schema, sys, mysql) ?
	  mysqlShowSysDatabases: false
	};
  }

  savePreferences(preferences) {
	if ( typeof preferences === 'object' ) {
	  this.preferences = Object.assign(this.preferences, preferences);
	  try {
		this.store();
	  } catch (error) {
		return Promise.reject(error);
	  }
	}
	return Promise.resolve(this.preferences);
  }

  resetPreferences() {
	this.preferences =  this.getDefaultPreferences();
	try {
	  this.store();
	} catch (error) {
	  return Promise.reject(error);
	}
	return Promise.resolve(this.preferences);
  }

  setPreferences() {
	this.preferences =  this.getDefaultPreferences();
	// Merge default preferences with storage preferences
	if ( fs.existsSync(path.join(__dirname, this.jsonFilePath)) ) {
	  let storagePreferences = JSON.parse( fs.readFileSync(path.join(__dirname, this.jsonFilePath)) );
	  Object.assign(this.preferences, storagePreferences);
	}
  }

  store() {
	fs.writeFileSync(path.join(__dirname, this.jsonFilePath), JSON.stringify(this.preferences), function (error) {
	  if (error) throw error;
	});
  }
}
