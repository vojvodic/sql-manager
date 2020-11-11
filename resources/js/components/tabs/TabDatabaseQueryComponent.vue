<template>
  <div style="display: flex; flex-flow: column; height: 100%;">
	<div class="sql-editor" style="flex: 0 0 1px;">
	  <textarea v-model.trim="sql" placeholder="SQL ..." class="" ref="sqlEditorReference" style="display: none;"></textarea>
	</div>
	<div class="pb-2 pt-1 pl-1 pr-1" style="border-bottom: 1px solid #ddd; flex: 0 0 auto;">
	  <div class="row no-gutters">
		<div class="col-4 sql-links">
		  <a href="javascript:;"
			 v-on:click="sqlLinks = (sqlLinks == 'sqlHistory' ? '' : 'sqlHistory')"
			 v-bind:class="{ 'active' : sqlLinks == 'sqlHistory' }">
			  <i class="fas" v-bind:class="sqlLinks == 'sqlHistory' ? 'fa-angle-down' : 'fa-angle-right'"></i>
			  History
		  </a>
		  <a href="javascript:;"
			 v-if="this.tab.table"
			 v-on:click="sqlLinks = (sqlLinks == 'sqlScripts' ? '' : 'sqlScripts')"
			 v-bind:class="{ 'active' : sqlLinks == 'sqlScripts' }">
			   <i class="fas" v-bind:class="sqlLinks == 'sqlScripts' ? 'fa-angle-down' : 'fa-angle-right'"></i>
			   Scripts
		  </a>
		  <a href="javascript:;"
			 v-if="this.tab.table && this.tab.table.type == 'view'"
			 v-on:click="sqlLinks = (sqlLinks == 'viewDefinition' ? '' : 'viewDefinition')"
			 v-bind:class="{ 'active' : sqlLinks == 'viewDefinition' }">
			   <i class="fas" v-bind:class="sqlLinks == 'viewDefinition' ? 'fa-angle-down' : 'fa-angle-right'"></i>
			   View Definition
		  </a>
		</div>
		<div class="col-4 sql-statistics">
		  <span class="" v-show="executionTime != ''">
			Time: {{ executionTime }}ms
		  </span>
		  <span class="" v-show="executionTime != '' && affectedRows == null">
			Results: {{ results.length }}
		  </span>
		  <span class="" v-show="executionTime != '' && affectedRows != null">
			Affected Rows: {{ affectedRows }}
		  </span>
		</div>
		<div class="col-4 sql-buttons">
		  <button type="button" class="btn btn-warning btn-sm" v-on:click="clearSQLresults()" title="Clear Data" v-show="executionTime != '' || error != ''">
			<i class="fas fa-eraser"></i>
		  </button>
		  <button type="button" class="btn btn-warning btn-sm" v-on:click="saveResults()" title="Save results to CSV" v-show="(executionTime != '' || error != '') && results.length">
			<i class="fas fa-file-csv"></i>
		  </button>
		  <button type="button" class="btn btn-warning btn-sm" v-on:click="runSQL()" title="Run SQL" v-bind:disabled="awaitingSQLresponse">
			Run SQL <i class="fas fa-spinner fa-pulse" v-if="awaitingSQLresponse"></i>
		  </button>
		</div>
	  </div>
	</div>
	<div class="sql-results app-overflow-scroll" ref="sqlResultsReference" style="flex: 1 1 1px;" v-show="sqlLinks == ''">
	  <render-results v-if="results.length || fields.length"
					  v-bind:results="results"
					  v-bind:fields="fields"
					  v-bind:resultsScrollTop="resultsScrollTop">
	  </render-results>
	  <div v-show="error" class="alert alert-danger" style="border-radius: 0px;">
		{{ error }}
	  </div>
	</div>
	<div class="app-overflow-scroll" style="flex: 1 1 1px;" v-show="sqlLinks != ''">
	  <sql-history v-if="sqlLinks == 'sqlHistory'"
				   v-bind:server="tab.server"
				   v-bind:connectedDatabaseName="tab.database ? tab.database.database_name : ''"
				   v-on:run-sql="runSQL($event)"
				   v-on:append-sql="appendSqlToEditor($event)"
				   v-on="$listeners">
	  </sql-history>
	  <sql-scripts v-if="sqlLinks == 'sqlScripts'"
				   v-bind:server="tab.server"
				   v-bind:database="tab.database"
				   v-bind:table="tab.table"
				   v-on:append-sql="appendSqlToEditor($event)"
				   v-on="$listeners">
	  </sql-scripts>
	  <view-definition v-if="sqlLinks == 'viewDefinition'"
					   v-bind:server="tab.server"
					   v-bind:database="tab.database"
					   v-bind:table="tab.table"
					   v-on:append-sql="appendSqlToEditor($event)"
					   v-on="$listeners">
	  </view-definition>
	</div>
  </div>
</template>

<script>
import mixin from './../../mixins/mixins.js';
import RenderResultsPartial from '../partials/RenderResultsPartial.vue';
import SqlHistoryPartial from '../partials/SqlHistoryPartial.vue';
import SqlScriptsPartial from '../partials/SqlScriptsPartial.vue';
import ViewDefinitionPartial from '../partials/ViewDefinitionPartial.vue';

export default {
  components: {
	'render-results': RenderResultsPartial,
	'view-definition': ViewDefinitionPartial,
	'sql-scripts': SqlScriptsPartial,
	'sql-history': SqlHistoryPartial,
  },
  mixins: [ mixin ],
  props: {
	preferences: Object,
	settings: Object,
	tab: Object
  },
  data : function() {
	return {
	  sql: '',
	  resultsQuery: '',
	  awaitingSQLresponse: false,
	  sqlLinks   : '',
	  executionTime    : '',
	  error            : '',
	  results          : [],
	  fields           : [],
	  resultsScrollTop : 0,
	  codeMirrorEditor : null,
	  affectedRows     : null
	}
  },
  mounted: function() {
	let self = this;
	this.$refs.sqlResultsReference.addEventListener('scroll', function() {
	  self.resultsScrollTop = this.scrollTop;
	});

	this.startCodeMirrorEditor(() => {
	  if (this.tab.params && this.tab.params.editorSQL) {
		this.appendSqlToEditor({'sql' : this.tab.params.editorSQL});
	  }
	});

	if (this.tab.params && this.tab.params.runSQL) {
	  this.runSQL({
		sql: this.tab.params.runSQL,
		cacheSQLHistory: false
	  });
	}
  },
  methods: {
	runSQL( init = {} ) {
	  // Process params present in init
	  let settings = {};

	  // Set default to true to cache SQL History
	  settings.cacheSQLHistory = init.hasOwnProperty('cacheSQLHistory') ? init.cacheSQLHistory : true;

	  // If SQL is present use it for query and ignore SQL editor value
	  if (init.hasOwnProperty('sql')) {
		settings.sql = init.sql;
	  } else {
		// Check for selected / highlighted text or just use sql from CodeMirror
		let selection = this.getSelectionText();
		settings.sql = selection ? selection : this.codeMirrorEditor.getValue();
	  }

	  // Validate if SQL is empty
	  if (settings.sql == '') {
		alert('Nothing to execute!');
		return;
	  }

	  // Reset results
	  this.clearSQLresults();

	  // Hide sql links if any visible
	  this.sqlLinks = '';

	  let data = {
		'database': this.tab.database ? this.tab.database.database_name : '',
		'cacheSQLHistory': settings.cacheSQLHistory,
		'query': settings.sql
	  }

	  this.awaitingSQLresponse = true;
	  this.resultsQuery = data.query;
	  axios.post('/servers/' + this.tab.server.server_id + '/run-sql', data).then((response) => {
		if (response.data.rows && response.data.rows.length) {
		  this.results = response.data.rows;
		} else if (response.data.hasOwnProperty('affectedRows')) {
		  this.affectedRows = response.data.affectedRows;
		}

		if(response.data.fields){
		  this.fields = response.data.fields;
		}

		this.executionTime = response.data.executionTime;
	  }).catch((error) => {
		if (error.response) {
		  this.error = error.response.data.message;
		}
	  }).finally(() => {
		  this.awaitingSQLresponse = false;
	  });
	},
	getSelectionText() {
	  let text = "";
	  if (window.getSelection) {
		text = window.getSelection().toString();
	  } else if (document.selection && document.selection.type != "Control") {
		text = document.selection.createRange().text;
	  }
	  return text;
	},
	clearSQLresults() {
	  this.results = [];
	  this.fields = [];
	  this.error = '';
	  this.executionTime = '';
	  this.affectedRows = null;
	  this.resultsQuery = '';
	},
	appendSqlToEditor(event){
	  let scrollInfo = this.codeMirrorEditor.getScrollInfo();
	  let currentValue = this.codeMirrorEditor.getValue();
	  let newValue = currentValue != '' ? currentValue + "\n" + event.sql : event.sql;
	  this.codeMirrorEditor.setValue(newValue);

	  setTimeout(() => {
		this.codeMirrorEditor.refresh();
		this.saveTabPreferences();
	  },500);

	  if (scrollInfo && scrollInfo.hasOwnProperty('left') && scrollInfo.hasOwnProperty('top')) {
		this.codeMirrorEditor.scrollTo(scrollInfo.left,scrollInfo.top);
	  }
	},
	startCodeMirrorEditor( codeMirrorStarted ) {
	  this.codeMirrorEditor = CodeMirror.fromTextArea(this.$refs.sqlEditorReference,{
		mode : 'text/x-mariadb',
		indentWithTabs: true,
		smartIndent: true,
		lineNumbers: false,
		matchBrackets : true,
		autofocus: true,
		extraKeys: {
		  "Tab": function(editor){
			editor.replaceSelection("","end");
			// TODO: Add hook here to run autocomplete
		  }
		}
	  });
	  this.codeMirrorEditor.on("blur", (event) => {
		this.saveTabPreferences()
	  });
	  codeMirrorStarted();
	},
	saveResults() {
	  let options = {
		buttonLabel : "Save",
		defaultPath : this.preferences.saveFileResultsPath,
		filters:[
		  { name: 'CSV',extensions: ['csv'] }
		]
	  };
	  const Notification = electronRemote.Notification;
	  electronRemote.dialog.showSaveDialog(null,options).then((result) => {
		if (typeof result == 'object' && result.filePath) {
		  if(!result.filePath.endsWith(".csv")){
			alert('CSV file is required');
			return false;
		  }
		  let data = {
			'database': this.tab.database ? this.tab.database.database_name : '',
			'filePath': result.filePath,
			'query': this.resultsQuery,
			'cacheSQLHistory': false
		  };
		  axios.post('/servers/' + this.tab.server.server_id + '/run-sql/save-results', data).then((response) => {
			this.$emit('update-preferences',{'saveFileResultsPath': result.filePath});
			this.$emit('show-alert',{class : 'alert-success', message: 'Results are saved' });
		  }).catch((error) => {
			if (error.response) {
			  this.$emit('show-alert', { type : 'responseError', response : error.response });
			}
		  });
		}
	  });
	},
	saveTabPreferences(){
	  let tabPreferences = this.preferences.tabs;
	  tabPreferences[this.tab.tab_id] = this.tab;
	  tabPreferences[this.tab.tab_id]['params']['editorSQL'] = this.codeMirrorEditor.getValue();
	  tabPreferences[this.tab.tab_id]['params']['runSQL'] = '';
	  this.$emit('update-preferences',{'tabs' : tabPreferences});
	}


  },
  watch: {
	'tab.active': function(active){
	  if(active){
		this.codeMirrorEditor.refresh();
	  }
	}
  }
}
</script>

<style>
  .sql-navbar {
	border-bottom: 1px solid #cacaca;
	padding: 0.5em;
  }
  .sql-editor {
	cursor: text;
  }
  .sql-editor > .CodeMirror {
	width: 100%;
	height: 25vh;
	border: none;
	outline: none;
	padding: 0.5em;
	border-bottom: 1px solid #cacaca;
	resize: vertical;
	background-color: #f5f5f5;
	color: #4f555a;
	font-size: 100%;
  }
  .sql-editor > .CodeMirror pre.CodeMirror-placeholder { color: #999; }
  .sql-statistics {
	font-size: 95%;
	font-weight: bold;
	padding-top: 11px;
	text-align: center;
  }
  .sql-statistics > span {
	margin-right: 5px;
	color: #2d3a46;
  }
  .sql-buttons {
	text-align: right;
	padding-right: 5px!important;
	padding-top: 5px;
  }
  .sql-links {
	text-align: left;
	padding-top: 10px;
	color: #2d3a46;
	transition: all 0.5s ease;
  }
  .sql-links a {
	color: #2d3a46;
	padding: 0px 5px 0px 5px;
  }
  .sql-links a:hover, .sql-links a.active {
	font-weight: bold;
	color: #2d3a46;
  }
  .table-wrapper table {
	border-collapse: collapse;
  }
  .table-wrapper thead th {
	position: sticky;
	top: 0;
  }
  .table-wrapper thead th:first-child {
	width: 1%;
  }
  .table-wrapper th {
	height: 25px;
	padding: 0px;
	margin: 0px;
	font-size: 95%;
	text-align: center;
	background-color: #f5f5f5;
	color: #2d3a46;
	font-weight: bold;
	word-wrap: break-word;
	border-top: none;
	border-bottom: 1px solid #ddd;
	border-right: 1px solid #ddd;
	border-left: 1px solid #ddd;
  }
  .table-wrapper td {
	height: 20px;
	padding: 0px;
	margin: 0px;
	font-size: 93%;
	text-align: left;
	border: 1px solid #ddd;
	color: #2d3a46;
	font-weight: normal;
	max-width: 30vw;
	min-width: 1vw;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	/*word-wrap: break-word;*/
  }
  .table-wrapper th:first-child, td:first-child {
	border-left: none;
  }
  .table-wrapper th:last-child, td:last-child {
	/* border-right: none; */
  }
</style>
