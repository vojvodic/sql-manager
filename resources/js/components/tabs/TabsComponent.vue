<template>
  <div class="tabs">
	<div v-if="tabs.length" style="display: flex; flex-flow: column; height: 100%;">
	  <div class="tab">
		<div v-for="(tab,i) in tabs"
			 v-bind:class="[{ 'active' : tab.active }, tab.template]"
			 class="tablinks"
			 v-bind:style="{ 'width' : tabWidth + '%' }">
		  <a href="javascript:;" v-on:click="showTab(tab)"  v-bind:class="{ 'has-server' : tab.server }" class="tab-name">
			<span> {{ tab.name }} </span>
			<small v-if="tab.server">{{ tab.server.user + '@' + tab.server.host }}</small>
		  </a>
		  <a href="javascript:;" class="tab-times" v-on:click="$emit('remove-tab',{'tab_id' : tab.tab_id})">
			<i class="fas fa-times-circle"></i>
		  </a>
		</div>
	  </div>
	  <div class="tab-content app-overflow-scroll" style="flex: 1 1 auto;">
		<div v-for="(tab, i) in tabs"
			 v-bind:key="tab.tab_id"
			 v-bind:class="{ 'h-100' : tab.active }"
			 v-show="tab.active">
		  <keep-alive>
			<component v-bind:is="tab.template"
					   v-bind:preferences="preferences"
					   v-bind:settings="settings"
					   v-bind:servers="servers"
					   v-bind:tab="tab"
					   v-on="$listeners">
			</component>
		  </keep-alive>
		</div>
	  </div>
	</div>
	<!-- There are no tabs show settings tab or if no servers then servers tab -->
	<div v-else-if="!servers.length">
	  <servers-tab v-bind:preferences="preferences"
				   v-bind:settings="settings"
				   v-bind:servers="servers"
				   v-on="$listeners">
	  </servers-tab>
	</div>
	<div v-else>
	  <settings-tab v-bind:preferences="preferences"
					v-bind:settings="settings"
					v-on="$listeners">
	  </settings-tab>
	</div>
  </div>
</template>

<script>
import tabDatabaseQueryComponent from './TabDatabaseQueryComponent.vue';
import tabSettingsComponent from './TabSettingsComponent.vue';
import tabServersComponent from './TabServersComponent.vue';
export default {
  components: {
	'database-query-tab': tabDatabaseQueryComponent,
	'settings-tab': tabSettingsComponent,
	'servers-tab': tabServersComponent
  },
  props: {
	preferences: Object,
	settings: Object,
	servers: Array,
	tabs: Array
  },
  data: function () {
	return {
	  tabWidth: 20,
	  tabWidthTimeout: null
	}
  },
  methods: {
	showTab: function(tab){
	  this.$emit('show-tab',{'tab_id' : tab.tab_id});
	  this.$emit('update-app-title',{'title' : tab.name});
	}
  },
  watch: {
	tabs: function(tabs) {
	  if (this.tabs.length > 1) {
		this.tabWidth = 100 / this.tabs.length;
	  } else {
		this.tabWidth = 50;
	  }

	  if (this.tabs.length) {
		this.tabs.forEach((tab, i) => {
		  if (tab.active) {
			this.$emit('update-app-title',{'title' : tab.name});
			return false;
		  }
		});
	  } else {
		this.$emit('update-app-title',{'title' : ''});
	  }
	}
  }
}
</script>
<style>
  .tabs {
	background-color: #ffffff;
	height: 100vh;
	overflow: auto;
  }
  .tab {
	overflow: hidden;
	flex: 0 0 auto;
	background-color: #2d3a46;
	height: 51px;
	overflow: hidden;
  }
  .tab .tablinks {
	background-color: inherit;
	float: left;
	border: none;
	outline: none;
	cursor: pointer;
	transition: 0.3s;
	border-right: 1px solid rgba(0, 0, 0, 0.125);
	height: 51px;
	display: inline-flex;
	padding-left: 10px;
	padding-right: 10px;
	position: relative;
  }
  .tab .tablinks.active {
	background-color: #ffffff;
  }
  .tab .tablinks.database-query-tab.active {
	background-color: #f5f5f5;
  }
  .tab .tablinks a.tab-name {
	color: #fff;
	font-size: 95%;
	width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	padding-top: 15px;
  }
  .tab .tablinks a.tab-name > span {
	font-weight: 500;
  }
  .tab .tablinks a.tab-name > span, .tab .tablinks a.tab-name > small {
	display: block;
	text-overflow: ellipsis;
	overflow: hidden;
  }
  .tab .tablinks a.tab-name.has-server {
	padding-top: 5px;
  }
  .tab .tablinks.active a.tab-name small {
	color: #615d5d;
	font-size: 75%;
	font-weight: bold;
  }
  .tab .tablinks a.tab-name small {
	color: #f0c078;
	font-size: 75%;
	font-weight: bold;
  }
  .tab .tablinks a.tab-times {
	color: #fff;
	font-size: 95%;
	position: absolute;
	height: 100%;
	top: 0;
	bottom: 0;
	right: 0;
	padding-top: 15px;
	padding-right: 5px;
	visibility: hidden;
  }
  .tab .tablinks.active:hover a.tab-times {
	visibility: visible;
	background-color: #fff;
  }
  .tab .tablinks:hover a.tab-times {
	visibility: visible;
	background-color: #2d3a46;
  }
  .tab .tablinks.active a {
	color: #2d3a46;
	font-weight: normal;
	height: 100%;
  }
  .tab .tablinks:hover a {
	font-weight: normal;
  }
</style>
