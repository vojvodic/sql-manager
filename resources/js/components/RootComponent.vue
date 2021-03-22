<template>
  <div v-if="appReady" class="vertical-panes" style="width: 100%;">
	<transition name="slide-fade">
	  <div class="alert app-overflow-scroll app-alert" v-bind:class="alert.class" v-show="alert.show">
		<button type="button" class="close" v-on:click="destroyAlert()">
		  <span aria-hidden="true">&times;</span>
		</button>
		<div class="app-alert-body">
		  <i class="fa"  v-bind:class="alert.icon" v-show="alert.icon != ''"></i>
		  {{ alert.message.trim() }}
		</div>
	  </div>
	</transition>
	<div class="pane navigation" style="position: relative; float:left;"  v-bind:style="{ 'width' : preferences.navigationWidth + 'px' }">
	  <navigation v-on:update-preferences="updatePreferences($event)"
				  v-on:open-context-menu="openContextMenu($event)"
				  v-on:refresh-servers="refreshServers($event)"
				  v-on:show-alert="showAlert($event)"
				  v-on:close-app="closeApp($event)"
				  v-on:new-tab="newTab($event)"
				  v-bind:preferences="preferences"
				  v-bind:settings="settings"
				  v-bind:servers="servers">
	  </navigation>
	  <div v-on:mousedown="initializeNavigationResizing($event)"
		   style="height: 100%; width: 15px; top: 0; bottom: 0; right: -10px; cursor: col-resize; position: absolute;">
	  </div>
	</div>
	<div class="pane tabs" style="width: auto;">
	  <tabs v-on:update-preferences="updatePreferences($event)"
			v-on:reset-preferences="resetPreferences($event)"
			v-on:update-app-title="updateAppTitle($event.title)"
			v-on:update-server="updateServer($event)"
			v-on:delete-server="deleteServer($event)"
			v-on:new-server="newServer($event)"
			v-on:remove-tab="removeTab($event)"
			v-on:show-alert="showAlert($event)"
			v-on:show-tab="showTab($event)"
			v-bind:preferences="preferences"
			v-bind:settings="settings"
			v-bind:servers="servers"
			v-bind:tabs="tabs">
	  </tabs>
	</div>
	<div class="context-menu" ref="contextMenu" v-show="contextMenuSettings.target != null">
	  <a href="javascript:;" v-for="link in contextMenuSettings.links" v-on:click="link.click">
		{{ link.label }}
	  </a>
	</div>
  </div>
  <div v-else class="text-center pt-5">
	<div class="d-block">
	  <i class="fa fa-spinner fa-2x fa-spin"></i>
	</div>
	<div class="d-block pt-2">
	  Loading
	</div>
  </div>
</template>

<script>

import { createPopper } from '@popperjs/core';
import TabsComponent from './tabs/TabsComponent.vue';
import NavigationComponent from './navigation/NavigationComponent.vue';
import mixin from './../mixins/mixins.js';
export default {
  components: {
	'navigation': NavigationComponent,
	'tabs': TabsComponent
  },
  mixins: [ mixin ],
  data: function() {
	return {
	  tabs: [],
	  servers: [],
	  settings: {},
	  appReady: false,
	  preferences: {},
	  navigationResizerBuffer: {},
	  updatePreferencesTimeout: null,
	  alert: {
		class: '',
		message: '',
		icon: '',
		show: false
	  },
	  contextMenuSettings: {
		target: null,
		links: []
	  }
	}
  },
  created: function() {
	this.updateAppTitle();
	this.startApp();

	window.onclick = event => {
	  if(this.contextMenuSettings.target != null){
		this.contextMenuSettings.target = null;
		this.contextMenuSettings.links = [];
	  }
	};

	window.oncontextmenu = event => {
	  if(this.contextMenuSettings.target != event.target ){
		this.contextMenuSettings.target = null;
		this.contextMenuSettings.links = [];
	  }
	};
  },
  methods: {
	startApp: function(){
	  axios.get('/start').then(response => {
		this.preferences = response.data.preferences;
		this.servers = response.data.servers;
		this.settings = response.data.settings;

		let preferencesNavigation = false;
		let preferencesTabs = false;
		if(typeof this.preferences == 'object' && this.preferences.hasOwnProperty('navigation') && Object.keys(this.preferences.navigation).length > 0){
		  preferencesNavigation = true;
		}
		if (typeof this.preferences == 'object' && this.preferences.hasOwnProperty('tabs') && Object.keys(this.preferences.tabs).length > 0) {
		  preferencesTabs = true;
		}

		let appReloding = localStorage.getItem('appReloding');
		if((preferencesNavigation || preferencesTabs) && (appReloding == "true" || confirm('Load from cache?'))){
		  if(preferencesTabs){
			for(let tab_id in this.preferences.tabs){
			  this.tabs.push(this.preferences.tabs[tab_id]);
			}
		  }
		} else{
		  this.preferences.navigation = {};
		  this.preferences.tabs = {};
		  this.updatePreferences();
		}

		if(appReloding){
		  localStorage.removeItem('appReloding');
		}

		this.appReady = true;
	  }).catch(error => {
		alert( error );
	  });
	},
	openContextMenu: function(event){
	  createPopper(event.target, this.$refs.contextMenu,{
		placement: 'bottom-start',
		modifiers:[
		  {
			name: 'offset',
			options: {
			  offset: [0, 2],
			}
		  }
		]
	  });
	  this.contextMenuSettings.target = event.target;
	  this.contextMenuSettings.links = event.links || [];
	},
	newServer: function(server){
	  this.servers.push(server);
	},
	updateServer: function(server){
	  for (let i = 0; i < this.servers.length; i++) {
		if(this.servers[i]['server_id'] == server.server_id){
		  this.$set(this.servers, i, server);
		  break;
		}
	  }
	},
	deleteServer: function(server){
	  for (let i = 0; i < this.servers.length; i++) {
		if(this.servers[i]['server_id'] == server.server_id){
		  this.$delete(this.servers, i);
		  if (this.preferences.navigation[server.server_id]) {
			delete this.preferences.navigation[server.server_id];
		  }
		  break;
		}
	  }
	},
	refreshServers: function(event) {
	  this.servers = [];
	  axios.get('/servers').then(response => {
		this.servers = response.data.servers;
	  }).catch(error => {
		if (error.response) {
		  this.showAlert({ type : 'responseError', response : error.response });
		}
	  });
	},
	newTab(tab) {
	  if (tab.tab_id) {
		let exists = false;
		for (let i = 0; i < this.tabs.length; i++) {
		  if (this.tabs[i]['tab_id'] == tab.tab_id) {
			this.tabs[i].active = true;
			exists = true;
		  } else {
			this.tabs[i].active = false;
		  }
		}
		if (exists) {
		  return false;
		}
	  } else {
		tab.tab_id = Math.random().toString(20).substring(3);
	  }

	  for (let i = 0; i < this.tabs.length; i++) {
		this.tabs[i].active = false;
	  }
	  if (!tab.params) {
		tab.params = {};
	  }
	  tab.active = true;
	  this.tabs.push(tab);
	  this.preferences.tabs[tab.tab_id] = tab;
	  this.updatePreferences();
	},
	showTab(event) {
	  for (let i = 0; i < this.tabs.length; i++) {
		let tab = this.tabs[i];
		if (tab.tab_id == event.tab_id) {
		  tab.active = true;
		} else{
		  tab.active = false;
		}
		this.$set(this.tabs, i, tab);
	  }
	},
	removeTab(event) {
	  for (let i = 0; i < this.tabs.length; i++) {
		if (this.tabs[i]['tab_id'] == event.tab_id) {
		  // If this tab is active then set next tab to active if next is not present then previous tab
		  if (this.tabs[i].active) {
			if (this.tabs[i + 1]) {
			  this.tabs[i + 1].active = true;
			} else if (this.tabs[i - 1]) {
			  this.tabs[i - 1].active = true;
			}
		  }
		  // Remove tab from tabs
		  this.$delete(this.tabs, i);

		  // Delete tab from tab preferences
		  if(this.preferences.tabs[event.tab_id]){
			delete this.preferences.tabs[event.tab_id];
		  }
		  this.updatePreferences();
		  break;
		}
	  }
	},
	resetPreferences: function() {
	  clearTimeout(this.updatePreferencesTimeout);
	  axios.post('preferences/reset').then(response => {
		this.preferences = response.data.preferences;
	  }).catch(error => {
		if (error.response) {
		  this.showAlert({ type : 'responseError', response : error.response });
		}
	  });
	},
	updatePreferences: function(preferences){
	  if(typeof preferences == 'object'){
		//TODO:: Do hard check and compare if objects are the same
		let changed = false;
		for (let key in preferences) {
		  if(this.preferences.hasOwnProperty(key)){
			changed = true;
			this.$set(this.preferences, key, preferences[key]);
		  }
		}

		if(!changed) {
		  return false;
		}
	  }

	  clearTimeout(this.updatePreferencesTimeout);

	  this.updatePreferencesTimeout = setTimeout(() => {
		axios.post('preferences/save',{'preferences' : this.preferences}).catch(error => {
		  if (error.response) {
			this.showAlert({ type : 'responseError', response : error.response });
		  }
		});
	  },1500);
	},
	initializeNavigationResizing: function(event) {
	  this.navigationResizerBuffer.startOffset = this.preferences.navigationWidth - event.pageX;
	  document.addEventListener('mousemove', this.startNavigationResizing, false);
	  document.addEventListener('mouseup', this.stopNavigationResizing, false);
	},
	startNavigationResizing: function(event) {
	  let newWidth = this.navigationResizerBuffer.startOffset + event.pageX;
	  if (newWidth > 300 && newWidth < 600) {
		this.preferences.navigationWidth = newWidth;
	  }
	},
	stopNavigationResizing: function() {
	  document.removeEventListener('mousemove', this.startNavigationResizing, false);
	  document.removeEventListener('mouseup', this.stopNavigationResizing, false);
	  this.navigationResizerBuffer = {};
	  this.updatePreferences();
	},
	showAlert: function(event){
	  if (event.type == 'responseError') {
		this.alert.class = 'alert-danger';
		this.alert.message = event.response.data.message;
		this.alert.icon = 'fa-exclamation-triangle';
	  } else{
		this.alert.class = event.class;
		this.alert.message = event.message;
	  }

	  if (this.alert.class == 'alert-success') {
		this.alert.icon = 'fa-check';
	  } else if (this.alert.class == 'alert-danger') {
		this.alert.icon = 'fa-exclamation-triangle';
	  }

	  this.alert.show = true;
	},
	destroyAlert: function(){
	  this.alert.show = false;
	  this.alert.class = '';
	  this.alert.message = '';
	  this.alert.icon = '';
	},
	updateAppTitle: function( append = '' ) {
	  document.title = 'SQL Manager' + (append != '' ? " - "  + append : '');
	},
	closeApp: function(event) {
	  // Clear navigation and tabs cache
	  // Await for data to be saved since calling electron window close will shut down express server
	  // Ignore any error and just close app once response is received

	  this.preferences.navigation = {};
	  this.preferences.tabs = {};
	  axios.post('preferences/save',{'preferences' : this.preferences}).finally(() => {
		electronRemote.getCurrentWindow().close();
	  });
	}
  }
}
</script>

<style>
  body {
	background-color: #2d3a46;
	color: #e7e8f1;
  }
  textarea.custom-form-control, input.custom-form-control, select.custom-form-control {
	width: 100%;
	outline: none;
	padding: 0.5em;
	border: 1px solid #cacaca;
	resize: vertical;
	background-color: #f5f5f5;
	color: #4f555a;
  }
  textarea.custom-form-control:active, input.custom-form-control:active, select.custom-form-control:active,
  textarea.custom-form-control:focus, input.custom-form-control:focus, select.custom-form-control:focus {
	background-color: #e6e3e3;
  }
  textarea:disabled, input:disabled, select:disabled {
	background-color: #d8d6d6;
	cursor: not-allowed;
  }
  a:hover, a:focus, a:active {
	text-decoration: none;
	outline: none;
  }
  div.custom-checkbox > label {
	padding-top: 2px;
  }

  /* Navigation */
  .vertical-panes .pane.navigation {
	background-color: #2d3a46;
  }
  .vertical-panes .pane.navigation li {
	background-color: #2d3a46;
	color: #e7e8f1;
	padding-left: 10px;
  }
  .vertical-panes .pane.navigation li.database-entry {
	padding: 2px;
  }
  .vertical-panes .pane.navigation li.database-entry a {
	margin-right: 3px;
  }
  .vertical-panes .pane.navigation li .app-host {
	cursor: pointer;
	font-size: 100%;
	text-align: center;
	color: #f0c078;
	font-weight: bold;
  }
  .vertical-panes .pane.navigation li.app-settings i.fas {
	cursor: pointer;
  }
  .vertical-panes .pane.navigation li.app-settings {
	font-size: 105%;
  }
  .vertical-panes .pane.navigation li i.fas:hover,
  .vertical-panes .pane.navigation li i.fas:focus {
	color: #f0c078;
  }
  .vertical-panes .pane.navigation li a {
	cursor: pointer;
	color: #cacaca;
	transition: all .3s ease;
  }
  .vertical-panes .pane.navigation li a:hover,
  .vertical-panes .pane.navigation li a:focus {
	 /* color: #f0c078; */
	text-decoration: none;
  }
  .vertical-panes .pane.navigation li a.is-active {
	/* color: #f0c078; */
	text-decoration: none;
	/* font-size: 102%; */
  }
  .vertical-panes .pane.navigation li.table-entry{
	white-space: nowrap;
  }
  .vertical-panes .pane.navigation li.table-entry a {
	font-size: 95%;
	white-space: nowrap;
  }
  .vertical-panes .pane.navigation li.table-entry li.column-entry {
	font-size: 90%;
	color: #cacaca;
	border-bottom: 1px solid #424d56;
  }
  .vertical-panes .pane.navigation li.table-entry li.column-entry span.data-type {
	font-size: 90%;
	font-style: italic;
  }

  /* App scrollbar */
  .app-overflow-scroll, .CodeMirror {
	overflow: auto;
  }

  .app-overflow-scroll::-webkit-scrollbar, .CodeMirror-vscrollbar::-webkit-scrollbar, .CodeMirror-hscrollbar::-webkit-scrollbar {
	width: 8px;
	height: 8px;
  }

  .CodeMirror-hints { z-index: 999999 !important; }

  .CodeMirror-scrollbar-filler {
	background-color: inherit !important;
  }

  .CodeMirror-vscrollbar:focus, .CodeMirror-hscrollbar:focus {
	outline: none;
	border: none;
	cursor: default !important;
  }

  .app-overflow-scroll::-webkit-scrollbar-track,
  .CodeMirror-vscrollbar::-webkit-scrollbar-track,
  .CodeMirror-hscrollbar::-webkit-scrollbar-track {
	background: inherit;
  }

  .app-overflow-scroll::-webkit-scrollbar-thumb,
  .CodeMirror-vscrollbar::-webkit-scrollbar-thumb,
  .CodeMirror-hscrollbar::-webkit-scrollbar-thumb {
	background: #888;
	border-radius: 0px;
  }

  .app-overflow-scroll::-webkit-scrollbar-thumb:hover,
  .CodeMirror-vscrollbar::-webkit-scrollbar-thumb:hover,
  .CodeMirror-hscrollbar::-webkit-scrollbar-thumb:hover {
	background: #f0c078;
  }

  .app-overflow-scroll::-webkit-scrollbar-corner,
  .CodeMirror-vscrollbar::-webkit-scrollbar-corner,
  .CodeMirror-hscrollbar::-webkit-scrollbar-corner {
	display: none;
  }

  .context-menu {
	box-shadow: 0px 1px 5px -2px rgba(0,0,0,0.75);
	background-color: #3a434c;
	font-size: 90%;
	padding: 0px;
	margin: 0px;
	min-width: 280px;
	max-width: 90vw;
	overflow: hidden;
	border-radius: 5px;
	z-index: 9999;
  }

  .context-menu a {
	padding: 7px 10px 7px 10px;
	display: block;
	width: 100%;
	color: #fff;
	border-bottom: 1px solid #fffefe21;
  }

  .context-menu a:last-child {
	border-bottom: 0px;
  }

  .app-alert {
	position: absolute;
	top: 65px;
	right: 15px;
	min-width: 300px;
	z-index: 99999;
	box-shadow: 0px 1px 5px -2px rgba(0,0,0,0.75);
	padding: 10px;
  }

  .app-alert .app-alert-body {
	padding: 20px 2px 5px 2px;
	font-size: 115%;
	letter-spacing: 0.2px;
  }

  .app-alert .fa {
	margin-right: 5px;
	font-size: 120%;
  }

  .slide-fade-enter-active {
	transition: all .3s ease;
  }
  .slide-fade-leave-active {
	transition: all .1s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  }
  .slide-fade-enter, .slide-fade-leave-to {
	transform: translateX(10px);
	opacity: 0;
  }
</style>
