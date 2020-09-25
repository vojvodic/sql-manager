const path = require('path')
const fs = require('fs')
const { parse } = require('json2csv');

module.exports = class SaveResultsService {

  constructor() {
	this.separator = ",";
	this.newLine = "\n";
  }

  save(filePath, results = []) {
	return new Promise(function(resolve,reject){
	  if(!results.length) {
		reject("Cannot create CSV file with no results");
		return;
	  } else if(!filePath) {
		reject("Cannot create CSV file without file path specified");
		return;
	  }

	  let csv;
	  try {
		csv = parse(results,{fields: Object.keys(results[0])});
	  } catch (err) {
		reject(err);
		return;
	  }

	  fs.writeFile(filePath, csv, 'utf8',function (error) {
		if(error) {
		  reject(error);
		} else {
		  resolve(1);
		}
	  });
	  return;
	});
  }
}
