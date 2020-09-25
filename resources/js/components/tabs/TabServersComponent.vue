<template>
  <div class="p-4">
	<div class="row" style="color: #2d3a46;">
	  <div class="col-sm-12 col-md-4">
		<div class="card">
		  <div class="card-header">
			{{ editServer.server_id ? 'Edit' : 'Create' }} Server Connection
		  </div>
		  <div class="card-body">
			<div class="form-group">
			  <label class="font-weight-bold">Driver</label>
			  <select class="custom-form-control" v-model="newServer.driver" v-on:change="newServer.port = (newServer.driver == 'pgsql' ? '5432' : '3306')" v-show="!editServer.server_id">
				<option v-for="(driverValue, driverKey) in settings.sqlDrivers" :value="driverKey">
				  {{ driverValue.nice_name }}
				</option>
			  </select>
			  <select class="custom-form-control" v-model="editServer.driver" disabled v-show="editServer.server_id">
				<option v-for="(driverValue, driverKey) in settings.sqlDrivers" :value="driverKey">
				  {{ driverValue.nice_name }}
				</option>
			  </select>
			</div>
			<div class="form-group">
			  <div class="row">
				<div class="col-7">
				  <label class="font-weight-bold">Server</label>
				  <input type="text" class="custom-form-control" v-model="newServer.host" autocomplete="off" v-show="!editServer.server_id">
				  <input type="text" class="custom-form-control" v-model="editServer.host" autocomplete="off" v-show="editServer.server_id">
				</div>
				<div class="col-5">
				  <label class="font-weight-bold">Port</label>
				  <input type="text" class="custom-form-control" v-model="newServer.port" autocomplete="off" v-show="!editServer.server_id">
				  <input type="text" class="custom-form-control" v-model="editServer.port" autocomplete="off" v-show="editServer.server_id">
				</div>
			  </div>
			</div>
			<div class="form-group">
			  <label class="font-weight-bold">User</label>
			  <input type="text" class="custom-form-control" v-model="newServer.user" autocomplete="off" v-show="!editServer.server_id">
			  <input type="text" class="custom-form-control" v-model="editServer.user" autocomplete="off" v-show="editServer.server_id">
			</div>
			<div class="form-group" v-show="newServer.driver == 'pgsql' || editServer.driver == 'pgsql'">
			  <label class="font-weight-bold">Database</label>
			  <input type="text" class="custom-form-control" v-model="newServer.database" v-show="!editServer.server_id">
			  <input type="text" class="custom-form-control" v-model="editServer.database" v-show="editServer.server_id">
			  <div class="alert alert-info mt-1">
				<span class="text-muted">
				  PostgreSQL requires database.
				  Provide database name or any of default databases such as <i>postgres</i>.
				</span>
			  </div>
			</div>
			<div class="form-group">
			  <label class="font-weight-bold">Password</label>
			  <input type="password" class="custom-form-control" v-model="newServer.password" v-show="!editServer.server_id">
			  <input type="password" class="custom-form-control" v-model="editServer.password" v-show="editServer.server_id">
			</div>
			<div class="alert alert-danger" v-show="errors.length">
			  <span v-for="error in errors" class="d-block">
				{{ error }}
			  </span>
			</div>
		  </div>
		  <div class="card-footer text-right">
			<button type="button" class="btn btn-secondary btn-sm" v-show="editServer.server_id" @click="cancelupdateServer()">Cancel</button>
			<button type="button" class="btn btn-danger btn-sm" v-show="editServer.server_id" @click="deleteServer()">Delete</button>
			<button type="button" class="btn btn-warning btn-sm" v-show="editServer.server_id" @click="saveServer()">Save</button>
			<button type="button" class="btn btn-warning btn-sm" v-show="!editServer.server_id" @click="addServer()">Add</button>
		  </div>
		</div>
	  </div>
	  <div class="col-sm-12 col-md-8">
		<div class="row">
		  <div class="col-sm-6 mb-2" v-for="server in servers" v-show="editServer.server_id != server.server_id">
			<div class="card">
			  <div class="card-body">
				<div class="form-group">
				  <label class="font-weight-bold">Driver</label>
				  <select class="custom-form-control" v-bind:value="server.driver" disabled>
					<option v-for="(driverValue, driverKey) in settings.sqlDrivers" :value="driverKey">
					  {{ driverValue.nice_name }}
					</option>
				  </select>
				</div>
				<div class="form-group">
				  <div class="row">
					<div class="col-7">
					  <label class="font-weight-bold">Server</label>
					  <input type="text" class="custom-form-control" v-bind:value="server.host" disabled>
					</div>
					<div class="col-5">
					  <label class="font-weight-bold">Port</label>
					  <input type="text" class="custom-form-control" v-bind:value="server.port" disabled>
					</div>
				  </div>
				</div>
				<div class="form-group">
				  <label class="font-weight-bold">User</label>
				  <input type="text" class="custom-form-control" v-bind:value="server.user" disabled>
				</div>
				<div class="form-group" v-show="server.driver == 'pgsql'">
				  <label class="font-weight-bold">Database</label>
				  <input type="tect" class="custom-form-control" v-bind:value="server.database" disabled>
				</div>
				<div class="form-group">
				  <label class="font-weight-bold">Password</label>
				  <input type="password" class="custom-form-control" v-bind:value="server.password" disabled>
				</div>
			  </div>
			  <div class="card-footer text-right">
				<button type="button" class="btn btn-secondary btn-sm" @click="updateServer(server)">Edit</button>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	</div>
  </div>
</template>

<script>
import mixin from './../../mixins/mixins.js';
export default {
  props: {
	preferences: Object,
	settings: Object,
	servers: Array,
  },
  mixins: [ mixin ],
  data : function() {
	return {
	  newServer: {},
	  editServer: {},
	  errors: [],
	};
  },
  created: function(){
	this.setNewServer();
  },
  methods: {
	cancelupdateServer: function(){
	  this.errors = [];
	  this.editServer = {};
	},
	updateServer: function(server){
	  this.errors = [];
	  this.setNewServer();
	  Object.assign(this.editServer, server); // Copy server data do not reference it
	},
	deleteServer: function(){
	  if (!confirm('Are you sure you want to delete this server connection?')) {
		return false;
	  }
	  this.errors = [];
	  axios.delete('servers/' + this.editServer.server_id).then( () => {
		this.$emit('delete-server', this.editServer);
		this.editServer = {};
	  }).catch(error => {
		if (error.response) {
		  this.$emit('show-alert', { type : 'responseError', response : error.response });
		}
	  });
	},
	saveServer: function(){
	  this.errors = [];
	  axios.put('servers/' + this.editServer.server_id,this.editServer).then(response => {
		this.$emit('update-server',this.editServer);
		this.editServer = {};
	}).catch(error => {
		if (error.response) {
		  this.$emit('show-alert', { type : 'responseError', response : error.response });
		}
	  });
	},
	addServer: function(){
	  this.errors = [];
	  axios.post('servers',this.newServer).then(response => {
		this.$emit('new-server', response.data.server);
		this.setNewServer();
	  }).catch(error => {
		if (error.response) {
		  this.$emit('show-alert', { type : 'responseError', response : error.response });
		}
	  });
	},
	setNewServer: function(){
	  this.newServer = {
		driver: 'mysql',
		host: '127.0.0.1',
		port: '3306',
		user: '',
		database: '',
		password: ''
	  };
	}
  }
}
</script>
