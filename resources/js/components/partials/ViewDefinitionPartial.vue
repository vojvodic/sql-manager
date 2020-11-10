<template>
  <div class="sql-scripts app-overflow-scroll">
	  <ul class="list-unstyled">
		<li class="sql-script-entry" v-if="viewDefinition != ''">
		  <div>
			<a href="javascript:;" v-on:click="appendViewDefinition()" title="Append SQL to Editor">
			  <i class="fa fa-edit"></i>
			</a>
		  </div>
		  <pre>{{ viewDefinition }}</pre>
		</li>
	  </ul>
  </div>
</template>


<script>
export default {
  props: {
	server: Object,
	database: Object,
	table: Object
  },
  data : function() {
	return {
	  viewDefinition: ''
	}
  },
  created: function(){
	if(this.server.driver == 'mysql' && this.database.database_name.toLowerCase() == 'information_schema'){
	  alert("MySQL system view");
	} else{
	  axios.get('/servers/' + this.server.server_id + '/database/' + this.database.database_name + '/tables/' + this.table.name + '/view-definition')
		   .then(response => {
			  this.viewDefinition = response.data;
		   }).catch(error => {
			  if(error.response) {
				this.$emit('show-alert', { type : 'responseError', response : error.response });
			  }
		   });
	}
  },
  methods: {
	appendViewDefinition: function(script){
	  this.$emit('append-sql', {sql : this.viewDefinition});
	}
  }
}
</script>

<style>
  .sql-scripts {
	width: 100%;
	height: 100%;
	color: #2d3a46;
  }

  .sql-scripts .sql-script-entry {
	padding-left: 10px;
	margin-bottom: 10px;
	margin-top: 10px;
	margin-left: 10px;
	border-left: 1px solid silver;
	transition: all 0.5s ease;
  }

  .sql-scripts .sql-script-entry a {
	font-size: 85%;
  }

  .sql-scripts .sql-script-entry:hover {
	border-left: 2px solid silver;
  }

  .sql-scripts .sql-script-entry pre {
	padding: 15px 0px 15px 0px;
	display: inline;
	color: #2d3a46;
  }
</style>
