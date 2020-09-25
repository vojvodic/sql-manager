<template>
  <div class="sql-scripts app-overflow-scroll">
	  <ul class="list-unstyled">
		<li v-for="script in scripts" class="sql-script-entry">
		  <div>
			<a href="javascript:;" v-on:click="appendSQL(script)" title="Append SQL to Editor">
			  <i class="fa fa-edit"></i>
			</a>
		  </div>
		  <pre>{{ script.sql }}</pre>
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
	  columns: []
	}
  },
  created: function(){
	axios.get('/servers/' + this.server.server_id + '/database/' + this.database.database_name + '/tables/' + this.table.name + '/columns')
		 .then(response => {
			response.data.columns.forEach((column, i) => {
			  this.columns.push(column.name);
			});
		 }).catch(error => {
			if(error.response) {
			  this.$emit('show-alert', { type : 'responseError', response : error.response });
			}
		 });
  },
  computed: {
	scripts: function(){
	  let scripts = [];

	  // Align SQL statements
	  scripts.push({
		sql:
`SELECT ${this.columns.join(",")}
  FROM ${this.table.name};`});

	  scripts.push({
		sql:
`INSERT INTO ${this.table.name} (${this.columns.join(",")})
     VALUES (${this.columns.join(",")});`});

	  scripts.push({
		sql:
`UPDATE ${this.table.name}
   SET ${this.columns.join(" = ?,\n       ")} = ?;`});

	  return scripts;
	}
  },
  methods: {
	appendSQL: function(script){
	  this.$emit('append-sql', script);
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
