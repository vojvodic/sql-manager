<template>
  <div class="settings-tab">
	<ul class="list-group list-group-flush">
	  <li class="list-group-item">
		<div class="row">
		  <div class="col-12">
			<p class="lead">Preferences</p>
		  </div>
		  <div class="col-12">
			<p><b>Navigation</b></p>
			<div class="form-group">
			  <div class="custom-control custom-checkbox">
				<input type="checkbox" class="custom-control-input" id="mysql_show_sys_databases" v-model="mysqlShowSysDatabases">
				<label class="custom-control-label" for="mysql_show_sys_databases">Show MySQL System Databases</label>
			  </div>
			</div>
			<div class="form-group">
			  <div class="custom-control custom-checkbox">
				<input type="checkbox" class="custom-control-input" id="pgsql_show_template_databases" v-model="pgsqlShowTemplateDatabases">
				<label class="custom-control-label" for="pgsql_show_template_databases">Show PostgreSQL template databases</label>
			  </div>
			</div>
		  </div>
		</div>
	  </li>
	</ul>
  </div>
</template>

<script>
export default {
  props: {
	preferences: Object,
	settings: Object
  },
  data : function() {
	return {
	  pgsqlShowTemplateDatabases: this.preferences.pgsqlShowTemplateDatabases,
	  mysqlShowSysDatabases: this.preferences.mysqlShowSysDatabases
	};
  },
  methods: {
	resetPreferences: function(){
	  if(confirm('Reset all your preferences and restore them to default values?')){
		this.$emit('reset-preferences');
	  }
	}
  },
  watch: {
	pgsqlShowTemplateDatabases: function(value){
	  this.$emit('update-preferences',{'pgsqlShowTemplateDatabases' : value});
	},
	mysqlShowSysDatabases: function(value){
	  this.$emit('update-preferences',{'mysqlShowSysDatabases' : value});
	}
  }
}
</script>
<style>
  .settings-tab {
	color: #2d3a46;
  }
  p.lead {
	font-size: 140%;
  }
</style>
