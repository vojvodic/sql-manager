<template>
  <li v-if="ifVisible" class="database-entry" v-bind:class="{ 'show-database': isActive }">
	<a href="javascript:void(0)" v-on:click="expandDatabase()" v-on:contextmenu="openContextMenu($event)" class="expand-entry" v-bind:class="{ 'is-active': isActive }" title="Expand Database">
	  <i class="fas" v-bind:class=" isActive ? 'fa-angle-down' : 'fa-angle-right' " v-show="!loading"></i>
	  <i class="fa fa-spinner" v-bind:class=" { 'fa-spin' : loading } " v-show="loading"></i>
	  {{ database.database_name }}
	</a>
	<ul v-show="isActive" class="list-unstyled pl-1">
	  <li class="pt-1 pb-1 tables-navigation">
		<a href="javascript:void(0)" v-on:click="makeTablesVisible()">
			<i class="fas" v-bind:class=" tablesVisible ? 'fa-angle-down' : 'fa-angle-right' "></i>
			<i class="fa fa-table"></i> Tables <span class="badge badge-secondary">{{ tables.length }}</span>
		</a>
		<ul class="list-unstyled pl-1" v-show="tablesVisible">
		  <li class="options">
			<input type="text" class="search-entry option" v-model="searchTables" placeholder="Search tables ...">
		  </li>
		  <table-navigation v-for="(table,i) in tables"
							v-show="( table.name.toUpperCase().includes(searchTables.toUpperCase()) )"
							v-bind:preferences="preferences"
							v-bind:database="database"
							v-bind:server="server"
							v-bind:table="table"
							v-bind:key="'t' + i"
							v-on="$listeners">
		  </table-navigation>
		</ul>
	  </li>
	  <li class="pt-1 pb-1 views-navigation">
		<a href="javascript:void(0)" v-on:click="makeViewsVisible()">
			<i class="fas" v-bind:class=" viewsVisible ? 'fa-angle-down' : 'fa-angle-right' "></i>
			<i class="fa fa-eye"></i> Views <span class="badge badge-secondary">{{ views.length }}</span>
		</a>
		<ul class="list-unstyled pl-1" v-show="viewsVisible">
		  <li class="options">
			<input type="text" class="search-entry option" v-model="searchViews" placeholder="Search views ...">
		  </li>
		  <table-navigation v-for="(view,i) in views"
							v-show="( view.name.toUpperCase().includes(searchViews.toUpperCase()) )"
							v-bind:preferences="preferences"
							v-bind:database="database"
							v-bind:server="server"
							v-bind:table="view"
							v-bind:key="'v' + i"
							v-on="$listeners">
		  </table-navigation>
		</ul>
	  </li>
	</ul>
  </li>
</template>

<script>
import mixin from './../../mixins/mixins.js';
import NavigationTableComponent from './NavigationTableComponent.vue';
export default {
  components: {
	'table-navigation': NavigationTableComponent
  },
  mixins: [ mixin ],
  props: {
	preferences: Object,
	database: Object,
	server: Object
  },
  data: function(){
	return {
	  tablesVisible: false,
	  viewsVisible: false,
	  searchTables: '',
	  searchViews: '',
	  isActive: false,
	  loading: false,
	  tables: [],
	  views: []
	}
  },
  created: function(){
	let preferencesDatabase = this.preferences.navigation[this.server.server_id][this.database.database_name];
	if(preferencesDatabase){
	  this.expandDatabase();
	  if (preferencesDatabase.hasOwnProperty('tables')) {
		this.tablesVisible = true;
	  }
	  if (preferencesDatabase.hasOwnProperty('views')) {
		this.viewsVisible = true;
	  }
	}
  },
  computed: {
	ifVisible: function(){
	  if (this.server.driver == 'mysql') {
		if (!this.preferences.mysqlShowSysDatabases && this.database.database_name.match(/information_schema|performance_schema|sys|mysql/g)) {
		  return false;
		}
	  } else if (this.server.driver == 'pgsql') {
		if (!this.preferences.pgsqlShowTemplateDatabases && this.database.is_template) {
		  return false;
		}
	  }
	  return true;
	}
  },
  methods: {
	openContextMenu: function(event){
	  event.preventDefault();

	  let newTab = {
		'title': this.server.host + '@' + this.server.user + ' > ' + this.database.database_name,
		'name':  this.database.database_name,
		'template': 'database-query-tab',
		'database': this.database,
		'server': this.server,
		'tab_id': this.server.id + this.database.database_name,
	  };

	  let links = [];

	  links.push({
		label: 'Query Tab',
		click: () => {
		  this.$emit('new-tab',newTab);
		}
	  });

	  if(this.isActive) {
		links.push({
		  label: 'Refresh',
		  click: () => {
			this.loadTables();
		  }
		});
	  }

	  this.$emit('open-context-menu',{
		'target': event.target,
		'links': links
	  });
	},
	expandDatabase: function() {
	  let navigationPreferences = this.preferences.navigation;

	  if (this.isActive) {
		this.isActive = false;
		if(navigationPreferences[this.server.server_id][this.database.database_name]){
		  delete navigationPreferences[this.server.server_id][this.database.database_name];
		}
	  } else {
		this.isActive = true;
		if(!navigationPreferences[this.server.server_id][this.database.database_name]){
		  navigationPreferences[this.server.server_id][this.database.database_name] = {};
		}
		if(!this.tables.length && !this.views.length){
		  this.loadTables();
		}
	  }

	  this.$emit('update-preferences',{'navigation' : navigationPreferences});
	},
	loadTables : function() {
	  this.tables = [];
	  this.views = [];
	  this.loading = true;
	  axios.get('/servers/' + this.server.server_id + '/database/' + this.database.database_name + '/tables')
		   .then(response => {
			  response.data.tables.forEach(item => {
				if(item.type == 'table'){
				  this.tables.push(item);
				} else if (item.type == 'view') {
				  this.views.push(item);
				}
			  });
			  this.loading = false;
		   }).catch(error => {
			  this.loading = false;
			  if(error.response) {
				this.$emit('show-alert', { type : 'responseError', response : error.response });
			  }
		   });
	},
	makeTablesVisible: function(){
	  let navigationPreferences = this.preferences.navigation;
	  if(this.tablesVisible){
		this.tablesVisible = false;
		if(navigationPreferences[this.server.server_id][this.database.database_name]['tables']){
		  delete navigationPreferences[this.server.server_id][this.database.database_name]['tables'];
		}
	  } else{
		this.tablesVisible = true;
		if(!navigationPreferences[this.server.server_id][this.database.database_name]['tables']){
		  navigationPreferences[this.server.server_id][this.database.database_name]['tables'] = {};
		}
	  }
	  this.$emit('update-preferences',{'navigation' : navigationPreferences});
	},
	makeViewsVisible: function(){
	  let navigationPreferences = this.preferences.navigation;
	  if(this.viewsVisible){
		this.viewsVisible = false;
		if(navigationPreferences[this.server.server_id][this.database.database_name]['views']){
		  delete navigationPreferences[this.server.server_id][this.database.database_name]['views'];
		}
	  } else{
		this.viewsVisible = true;
		if(!navigationPreferences[this.server.server_id][this.database.database_name]['views']){
		  navigationPreferences[this.server.server_id][this.database.database_name]['views'] = {};
		}
	  }
	  this.$emit('update-preferences',{'navigation' : navigationPreferences});
	}
  }
}
</script>

<style>
  .database-entry .entry-options .query-entry, .database-entry .entry-options .refresh-entry {
	margin-left: 5px;
  }

  .database-entry input.search-entry,
  .database-entry input.search-entry:focus,
  .database-entry input.search-entry:active {
	border-radius: 0px;
	border: none;
	background-color: inherit;
	border-bottom: 1px solid #cacaca2e;
	color: #cacaca;
	box-shadow: none;
	font-size: 95%;
	padding: 5px 0px 5px 0px;
	text-align: left;
	outline: none;
	text-align: left;
	width: 100%;
  }

  .tables-navigation li.options, .views-navigation li.options {
	font-size: 95%;
	display:flex;
  }

  .tables-navigation li.options .option, .views-navigation li.options .option {
	flex-flow: column nowrap;
	margin-left: 5px;
	justify-content: center;
	align-items: center;
  }

  .tables-navigation li.options .option:first-child, .views-navigation li.options .option:first-child {
	margin-left: 0px;
  }

  .tables-navigation li.options a.option , .views-navigation li.options a.option {
	padding-top: 7px;
  }

  .tables-navigation > a, .tables-navigation > a > .fa {
	font-size: 95%;
  }
  .views-navigation > a, .views-navigation > a > .fa {
	font-size: 95%;
  }
</style>
