<template>
  <li class="list-group-item server-entry" v-bind:class="{ 'show-server': isActive }">
	<a href="javascript:void(0)" v-on:click="expandServer()" v-on:contextmenu="openContextMenu($event)" class="expand-entry" v-bind:class="{ 'is-active': isActive }" title="Expand Server">
	  <i class="fas" v-bind:class=" isActive ? 'fa-angle-down' : 'fa-angle-right' " v-show="!loading"></i>
	  <i class="fa fa-spinner" v-bind:class=" { 'fa-spin' : loading } " v-show="loading"></i>
	  {{ server.user }}@{{ server.host }} <small class="text-muted">{{ server.driver }}</small>
	</a>
	<ul v-show="isActive" class="list-unstyled databases-list">
	  <database-navigation
		v-for="(database,i) in databases"
		v-bind:preferences="preferences"
		v-bind:database="database"
		v-bind:server="server"
		v-bind:key="i"
		v-on="$listeners">
	  </database-navigation>
	</ul>
  </li>
</template>

<script>
import mixin from './../../mixins/mixins.js';
import NavigationDatabaseComponent from './NavigationDatabaseComponent.vue';
export default {
  components: {
	'database-navigation': NavigationDatabaseComponent
  },
  mixins: [ mixin ],
  props: {
	preferences: Object,
	sumServers: Number,
	server: Object
  },
  data: function() {
	return {
	  isActive: false,
	  loading: false,
	  databases: []
	}
  },
  created: function(){
	if (this.sumServers == 1 || this.preferences.navigation[this.server.server_id]) {
	  this.expandServer();
	}
  },
  methods: {
	openContextMenu: function(event) {
	  event.preventDefault();

	  let links = [];

	  links.push({
		label: 'Query Tab',
		click: () => {
		  this.$emit('new-tab',{
			'title': this.server.host + '@' + this.server.user,
			'name': this.server.host + '@' + this.server.user,
			'template': 'database-query-tab',
			'server': this.server,
			'tab_id': this.server.server_id
		  });
		}
	  });
	  if(this.isActive){
		links.push({
		  label: 'Refresh Databases',
		  click: () => {
			this.loadDatabases();
		  }
		});
	  }
	  this.$emit('open-context-menu',{
		'target': event.target,
		'links': links
	  });
	},
	expandServer: function() {
	  let navigationPreferences = this.preferences.navigation;

	  if(this.isActive){
		this.isActive = false;
		if(navigationPreferences[this.server.server_id]){
		  delete navigationPreferences[this.server.server_id];
		}
	  } else {
		this.isActive = true;
		if(!navigationPreferences[this.server.server_id]){
		  navigationPreferences[this.server.server_id] = {};
		}
		if(!this.databases.length){
		  this.loadDatabases();
		}
	  }
	  this.$emit('update-preferences',{'navigation' : navigationPreferences});
	},
	loadDatabases: function() {
	  this.databases = [];
	  this.loading = true;
	  axios.get('/servers/' + this.server.server_id + '/databases')
		   .then(response => {
			 this.loading = false;
			 this.databases = response.data.databases;
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
  .server-entry .expand-entry {
	white-space: nowrap;
  }
  .server-entry .entry-options .query-entry, .server-entry .entry-options .refresh-entry {
	margin-left: 5px;
  }
  .server-entry ul.databases-list, .server-entry .entry-options {
	padding-left: 10px;
	padding-top: 5px;
  }
</style>
