const path = require('path')
const fs = require('fs')

module.exports = class SettingsService {

  constructor() {
	this.setSettings();
  }

  getSettings() {
	return this.settings;
  }

  setSettings() {
	this.settings = {
	  /* App Name */
	  'appName': 'SQL Manager',

	  /* Supported SQL drivers */
	  'sqlDrivers': {
		'mysql': {
		  'nice_name' : 'MySQL'
		},
		'pgsql': {
		  'nice_name': 'PostgreSQL'
		}
	  }
	};
  }
}
