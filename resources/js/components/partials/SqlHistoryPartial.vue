<template>
  <div class="sql-history">
	<ul class="list-unstyled" v-if="this.history.length > 0">
	  <li class="title">
		SQL History - <i>{{ server.user }}@{{ server.host }} <small class="text-muted">{{ server.driver }}</small></i>
		<a href="javascript:;" class="text-muted ml-2" v-on:click="deleteSQLHistory()">
		  <i class="fa fa-trash"></i>
		</a>
	  </li>
	  <li class="search-sql-history">
		<input type="text" v-model="searchSQLHistory" placeholder="Search...">
	  </li>
	  <li v-for="(history, dbName) in sqlHistory" class="sql-history-entry">
		  <span class="db-name" v-show="dbName != ''">
			<i class="fa fa-database"></i> {{ dbName }}
		  </span>
		  <ul class="list-unstyled">
			<li v-for="h in history"
				v-show="( h.sql.toUpperCase().includes(searchSQLHistory.toUpperCase()) )">
			  <div class="w-100">
				<a href="javascript:;" class="append-sql-history" v-on:click="appendSQLHistory({'database_name': dbName, 'sql': h.sql})" title="Append SQL to Editor">
				  <i class="fa fa-edit"></i>
				</a>
				<a href="javascript:;" class="execute-sql-history ml-1" v-on:click="executeSQLHistory({'database_name': dbName, 'sql': h.sql})" title="Execute SQL" v-show="dbName == connectedDatabaseName">
				  <i class="fa fa-play"></i>
				</a>
				<br>
				<small class="text-muted">{{ new Date(h.created_at).toLocaleString() }}</small>
			  </div>
			  <pre>{{ h.sql }}</pre>
			</li>
		  </ul>
	  </li>
	</ul>
	<div v-else>
	  No sql has been executed for server <i>{{ server.user }}@{{ server.host }} <small class="text-muted">{{ server.driver }}</small></i>
	</div>
  </div>
</template>


<script>
export default {
  props: {
	server: Object,
	connectedDatabaseName: String
  },
  data : function() {
	return {
	  searchSQLHistory: '',
	  history: []
	}
  },
  created: function(){
	axios.get('/servers/' + this.server.server_id + '/sql-history')
		 .then(response => {
			this.history = response.data.history;
		 }).catch(error => {
			if(error.response) {
			  this.$emit('show-alert', { type : 'responseError', response : error.response });
			}
		 });
  },
  computed: {
	sqlHistory: function() {
	  let sqlHistory = {};

	  if(this.history.length == 0) return sqlHistory;

	  if(this.connectedDatabaseName){
		sqlHistory[this.connectedDatabaseName] = [];
	  }
	  this.history.forEach((item, i) => {
		if(!sqlHistory[item.database_name]){
		  sqlHistory[item.database_name] = [];
		}
		sqlHistory[item.database_name].push(item);
	  });
	  return sqlHistory;
	}
  },
  methods: {
	deleteSQLHistory: function(){
	  if( !confirm('Are you sure you want to delete sql history for this server?') ){
		return false;
	  }

	  axios.delete('/servers/' + this.server.server_id + '/sql-history')
		   .then(response => {
			  this.history =  response.data.history;
		   }).catch(error => {
			  if(error.response) {
				this.$emit('show-alert', { type : 'responseError', response : error.response });
			  }
		   });
	},
	executeSQLHistory: function(history){
	  if(history.database_name != this.connectedDatabaseName) {
		alert('Not connected to database ' + history.database_name);
		return false;
	  }
	  this.$emit('run-sql', {sql: history.sql, cacheSQLHistory: false});
	},
	appendSQLHistory: function(history){
	  this.$emit('append-sql', history);
	}
  }
}
</script>

<style>
  .sql-history {
	font-size: 100%;
	width: 100%;
	height: 100%;
	padding: 10px 5px 5px 10px;
	color: #2d3a46;
  }

  .sql-history .title {
	font-size: 110%;
	text-align: center;
	padding-bottom: 10px;
  }

  .sql-history .search-sql-history > input {
	border: none;
	outline: none;
	width: 100%;
	color: #6c757d;
	font-size: 100%;
	padding: 3px;
  }

  .sql-history .sql-history-entry {
	padding: 10px 0px 10px 0px;
	border-top: 1px solid silver;
  }

  .sql-history .sql-history-entry .db-name {
	color: #545b62;
	font-size: 105%;
  }

  .sql-history .sql-history-entry > ul {
	padding-left: 15px;
  }

  .sql-history .sql-history-entry > ul li {
	padding-left: 10px;
	margin-bottom: 10px;
	margin-top: 10px;
	border-left: 1px solid silver;
	transition: all 0.5s ease;
  }

  .sql-history .sql-history-entry > ul li:hover {
	border-left: 2px solid silver;
  }

  .sql-history .sql-history-entry > ul li a {
	border-left: 1px solid silver;
	padding-left: 10px;
	font-size: 85%;
  }

  .sql-history .sql-history-entry > ul li a:first-child {
	border-left: none;
	padding-left: 0px;
  }

  .sql-history .sql-history-entry > ul li pre {
	padding: 15px 0px 15px 0px;
	display: inline;
	color: #2d3a46;
  }
</style>
