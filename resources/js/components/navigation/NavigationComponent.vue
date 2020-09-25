<template>
  <aside class="menu">
	<ul class="list-group list-group-flush app-info">
	  <li class="list-group-item">
		<div class="row no-gutters">
		  <div class="col-4">
			<a href="javascript:;" class="ml-2"  v-on:click="$emit('close-app')" title="Close">
				<i class="fa fa-power-off"></i>
			</a>
		  </div>
		  <div class="col-4 text-center">
			<a href="javascript:;" v-on:click="locationReload(true)" title="Reload" class="app-host">
			  {{ settings.appName }}
			</a>
		  </div>
		  <div class="col-4 text-right">
			<a v-show="servers.length" href="javascript:;" class="ml-2" title="Refresh Servers">
			  <i class="fas fa-sync" v-on:click="$emit('refresh-servers')"></i>
			</a>
			<a href="javascript:;" class="ml-2"  v-on:click="openServersTab( tab_id =  'servers' )" title="Servers">
			  <i class="fas fa-server"></i>
			</a>
			<a href="javascript:;" class="ml-2"  v-on:click="openSettingsTab( tab_id =  'settings' )" title="Settings">
			  <i class="fas fa-cogs"></i>
			</a>
		  </div>
		</div>
	  </li>
	</ul>
	<ul class="servers-list app-overflow-scroll list-group list-group-flush">
	  <server-navigation v-for="(server,i) in servers"
						 v-bind:sumServers="servers.length"
						 v-bind:preferences="preferences"
						 v-bind:server="server"
						 v-bind:key="i"
						 v-on="$listeners">
	  </server-navigation>
	</ul>
  </aside>
</template>

<script>
import NavigationServerComponent from './NavigationServerComponent.vue';
import mixin from './../../mixins/mixins.js';
export default {
  components: {
	'server-navigation': NavigationServerComponent
  },
  mixins: [ mixin ],
  props: {
	preferences: Object,
	databases: Array,
	settings: Object,
	servers: Array
  },
  methods: {
	openSettingsTab: function(tab_id) {
	  this.$emit('new-tab', {
		'template': 'settings-tab',
		'name': 'Settings',
		'tab_id': tab_id
	  });
	},
	openServersTab: function(tab_id) {
	  this.$emit('new-tab', {
		'template': 'servers-tab',
		'name': 'Servers',
		'tab_id': tab_id
	  });
	}
  }
}
</script>

<style>
  aside.menu {
	display: flex;
	flex-direction: column;
	height: 100vh;
  }
  aside.menu ul.app-info {
	flex: 0 0 auto;
	border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  }
  aside.menu ul.app-info li {
	height: 50px;
	padding-top: 15px;
  }
  aside.menu ul.servers-list {
	flex: 1 1 auto;
  }
</style>
