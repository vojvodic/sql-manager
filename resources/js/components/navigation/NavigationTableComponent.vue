<template>
  <li class="table-entry" v-bind:class="{ 'show-table': isActive }">
	<a href="javascript:void(0)" v-on:click="expandTable(table)" v-on:contextmenu="openContextMenu($event)" class="expand-entry" title="Expand Table">
	  <i class="fas" v-bind:class=" isActive ? 'fa-angle-down' : 'fa-angle-right' " v-show="!loading"></i>
	  <i class="fa fa-spinner" v-bind:class=" { 'fa-spin' : loading } " v-show="loading"></i>
	  {{ table.name }}
	</a>
	<ul v-show="isActive" class="list-unstyled pl-1">
	  <li v-for="column in columns" class="column-entry">
		<span class="column-name">{{ column.name }}</span>
		<br>
		<span class="data-type">{{ column.data_type }}</span>
	  </li>
	</ul>
  </li>
</template>

<script>
import mixin from './../../mixins/mixins.js';
export default {
  mixins: [ mixin ],
  props: {
	preferences: Object,
	database: Object,
	server: Object,
	table: Object
  },
  data: function() {
	return {
	  isActive: false,
	  loading: false,
	  columns: []
	}
  },
  created: function(){
	let navigationPreferences = this.preferences.navigation;
	let type = this.table.type == 'table' ? 'tables' : 'views';
	if(navigationPreferences[this.server.server_id][this.database.database_name][type] &&
	   navigationPreferences[this.server.server_id][this.database.database_name][type][this.table.name]){
	  this.expandTable();
	}
  },
  methods: {
	openContextMenu: function(event) {
	  event.preventDefault();

	  let newTab = {
		'title': this.server.host + '@' + this.server.user + ' > ' + this.database.database_name,
		'name':  this.database.database_name + '.' + this.table.name,
		'template': 'database-query-tab',
		'database': this.database,
		'table': this.table,
		'server': this.server,
		'tab_id': this.server.id + this.database.database_name + this.table.name,
	  };

	  let links = [];

	  links.push({
		label: 'Query Tab',
		click: () => {
		  this.$emit('new-tab',newTab);
		}
	  });
	  if (this.isActive) {
		links.push({
		  label: 'Refresh Columns',
		  click: () => {
			this.loadColumns();
		  }
		});
	  }
	  let query_all = {
		'params': {
		  'runSQL': "SELECT * FROM " + this.table.name,
		  'table': this.table
		}
	  };
	  links.push({
		label: query_all.params.runSQL,
		click: () => {
		  this.$emit('new-tab',{...query_all, ...newTab});
		}
	  });

	  let query_limit = {
		'params': {
		  'runSQL': "SELECT * FROM " + this.table.name + " LIMIT 50",
		  'table': this.table
		}
	  };
	  links.push({
		label: query_limit.params.runSQL,
		click: () => {
		  this.$emit('new-tab',{...query_limit, ...newTab});
		}
	  });

	  this.$emit('open-context-menu',{
		'target': event.target,
		'links': links
	  });
	},
	expandTable: function() {
	  let navigationPreferences = this.preferences.navigation;
	  let type = this.table.type == 'table' ? 'tables' : 'views';

	  if(this.isActive) {
		this.isActive = false;
		if(navigationPreferences[this.server.server_id][this.database.database_name][type] &&
		   navigationPreferences[this.server.server_id][this.database.database_name][type][this.table.name]) {
		  delete navigationPreferences[this.server.server_id][this.database.database_name][type][this.table.name];
		}
	  } else {
		this.isActive = true;
		if(navigationPreferences[this.server.server_id][this.database.database_name][type] &&
		   !navigationPreferences[this.server.server_id][this.database.database_name][type][this.table.name]) {
		  navigationPreferences[this.server.server_id][this.database.database_name][type][this.table.name] = {};
		}
		if(!this.columns.length) {
		  this.loadColumns();
		}
	  }

	  this.$emit('update-preferences',{'navigation' : navigationPreferences});
	},
	loadColumns : function() {
	  this.columns = [];
	  this.loading = true;
	  axios.get('/servers/' + this.server.server_id + '/database/' + this.database.database_name + '/tables/' + this.table.name + '/columns')
		   .then(response => {
			 this.loading = false;
			 this.columns = response.data.columns;
		   }).catch(error => {
			 this.loading = false;
			 if(error.response) {
			   this.$emit('show-alert', { type : 'responseError', response : error.response });
			 }
		   });
	}
  }
}
</script>
<style>
  .table-entry .entry-options .query-entry, .table-entry .entry-options .refresh-entry {
	margin-left: 5px;
  }
</style>
