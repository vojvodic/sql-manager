<template>
  <div>
	<div class="as-table" v-bind:style="{ 'width' : tableWidth + 'px', 'height' : tableHeight + 'px'}">
	  <div class="as-table-row table-header" v-bind:style="{ 'top' : resultsScrollTop + 'px'}" v-bind:class="{'header-shadow' : resultsScrollTop != 0}">
		<div v-for="(header) in headers" class="as-table-col" v-bind:style="{ 'width' : header.width + 'px'}" style="position: relative;">
		  {{ header.name }}
		  <div  v-if="header.name"
				v-on:mousedown="initializeColumnResizing($event,header)"
				style="height: 100%; width: 15px; top: 0; bottom: 0; right: 0; cursor: col-resize; position: absolute;">
		  </div>
		</div>
	  </div>
	  <div v-for="(index) in Object.keys(visibleResults).sort()" class="as-table-row table-data" v-bind:style="{ 'top' : ((Number(index) + 1) * 25) + 'px'}">
		<div v-for="(header) in headers"
			 class="as-table-col"
			 v-bind:style="{ 'width' : header.width + 'px', 'text-align' : header.textAlign }"
			 v-on:click="showModal(  header.name != '' ? visibleResults[index][header.name] : null )"
			 v-text="(header.name != '' ? visibleResults[index][header.name] : (Number(index) + 1))">
		</div>
	  </div>
	</div>
  </div>
</template>

<script>
export default {
  props: {
	resultsScrollTop: Number,
	results: Array,
	fields: Array,
  },
  data : function() {
	return {
	  columnWidth: {
		letter: 10,
		min: 60,
		max: 600
	  },
	  tableHeight: 0,
	  tableWidth: 0,
	  visibleResults: {},
	  headers: [],
	  startIndex: 0,
	  endIndex: 49,
	  columnResizerBuffer: {} // Keep reference to header that is resizing as well as inital offset from left
	}
  },
  created: async function(){
	// Set table height - each table row is 25px + header 25px
	this.tableHeight = this.results.length * 25 + 25;

	this.headers = await this.setHeaders();

	// Do first render of result
	let firstRender = true;
	this.renderResults(firstRender);
  },
  beforeUpdate: function(){
	if (this.startIndex != 0) {
	  for (let index in this.visibleResults) {
		if( Number(index) < (this.startIndex - 10) ){
		  delete(this.visibleResults[index]);
		} else if( Number(index) > (this.endIndex + 50) ) {
		  delete(this.visibleResults[index]);
		}
	  }
	}
  },
  methods: {
	setHeaders: function() {
	  let headers = [];
	  // Set first column which will indicate row numbers: 1,2,3,4,5,....
	  let firstColumnWidth = (this.results.length).toString().length * 15 < 30 ? 30 : (this.results.length).toString().length * 15;
	  headers.push({name: '', width: firstColumnWidth });
	  this.tableWidth += firstColumnWidth;

	  // Set headers and header width (header width based on string length, this is not 100% accurate due to Kerning, DPI, ...)
	  if(this.fields.length) {
		this.fields.forEach((field, i) => {
		  this.setHeader(headers,field.name);
		});
	  } else if(this.results.length){
		// No fields returned from sql client - set headers based on first row data
		for (let key in this.results[0]) {
		  this.setHeader(headers,key);
		}
	  }
	  return headers;
	},
	setHeader: function(headers,name) {
	  let headerWidth =  (name.length * this.columnWidth.letter) < this.columnWidth.min
						  ? this.columnWidth.min
						  : (name.length * this.columnWidth.letter);

	  headerWidth = (headerWidth > this.columnWidth.max ? this.columnWidth.max : headerWidth);
	  headers.push({
		name: name,
		width: headerWidth,
		textAlign: 'left'
	  });
	  this.tableWidth += headerWidth;
	},
	renderResults: function(firstRender = false) {
	  if (!firstRender) {
		this.startIndex = parseInt(this.resultsScrollTop / 25);
		this.endIndex = this.startIndex + 50;
	  }

	  for(let i = this.startIndex; i <= this.endIndex; i++){
		if(i == this.results.length) {
		  this.endIndex = i - 1;
		  break;
		}

		// During first render adjust header width (column width) based on string length in results
		// Align center numbers and boolean's
		if (firstRender) {
		  // Start from 1 since 0 is first column which only indicates row numbers
		  for(var h = 1; h < this.headers.length; h++) {
			let headerName = this.headers[h]['name'];
			var value = this.results[i][headerName];

			if(value == null || value.toString().replace(/\s+/, "") == ''){
			  continue;
			}

			let currentHeaderTextAlign = this.headers[h]['textAlign'];
			if((typeof value == 'number' || typeof value == 'boolean') && currentHeaderTextAlign == 'left') {
			  this.headers[h]['textAlign'] = 'center';
			}

			let currentHeaderWidth = this.headers[h]['width'];
			let newHeaderWidth = (value.toString().length * this.columnWidth.letter) < this.columnWidth.min
								  ? this.columnWidth.min
								  : (value.toString().length * this.columnWidth.letter);

			newHeaderWidth = (newHeaderWidth > this.columnWidth.max ? this.columnWidth.max : newHeaderWidth);
			if(currentHeaderWidth < newHeaderWidth){
			  this.tableWidth -= currentHeaderWidth;
			  this.headers[h].width = newHeaderWidth;
			  this.tableWidth += newHeaderWidth;
			}
		  }
		}

		if (!this.visibleResults[i]) {
		  this.visibleResults[i] = this.results[i];
		}
	  }
	},
	initializeColumnResizing: function(event,header) {
	  this.columnResizerBuffer.startOffset = header.width - event.pageX;
	  this.columnResizerBuffer.header = header;
	  document.addEventListener('mousemove', this.startColumnResizing, false);
	  document.addEventListener('mouseup', this.stopColumnResizing, false);
	},
	startColumnResizing: function(event) {
	  let newWidth = this.columnResizerBuffer.startOffset + event.pageX;
	  if(newWidth > this.columnWidth.min){
		this.tableWidth = this.tableWidth - this.columnResizerBuffer.header.width;
		this.tableWidth += newWidth;
		this.columnResizerBuffer.header.width = newWidth;
	  }
	},
	stopColumnResizing: function() {
	  document.removeEventListener('mousemove', this.startColumnResizing, false);
	  document.removeEventListener('mouseup', this.stopColumnResizing, false);
	  this.columnResizerBuffer = {};
	},
	showModal: function(content = null){
	  if(content == null){
		return false;
	  }

	  let text = typeof content == 'Object' ? JSON.stringify(content, null, 2) : content;

	  this.$modal.show(
		{template: `
		  <div class="app-modal app-overflow-scroll">
			<div class="app-modal-content">
			  <pre>{{ text }}</pre>
			</div>
		  </div>`,
		props: ['text'],
		adaptive: true},
		{ 'text':  text },
		{ height: 'auto', width: "70%" }
	  );
	}
  },
  watch: {
	resultsScrollTop: function() {
	  // During scroll rerender results based on offset from top
	  this.renderResults();
	}
  }
}
</script>

<style>
  .as-table {
	position: relative;
	margin: 0px;
	padding: 0px;
	background-color: inherit;
	color: #2d3a46;
  }

  .as-table-row {
	width: auto;
	clear: both;
	margin: 0px;
	padding: 0px;
	white-space: nowrap;
	overflow: hidden;
	position: absolute;
  }

.as-table-row:nth-child(even){background: #fff}
.as-table-row:nth-child(odd) {background: #f7f5f5}

  .as-table-col:first-child {
	text-align: center;
  }

  .as-table-col {
	float: left;
	padding: 0px 3px 0px 3px;
	height: 25px;
	text-overflow: ellipsis;
	overflow: hidden;
	border-bottom: 1px solid silver;
	border-right: 1px solid silver;
	font-size: 14px;
  }

  .as-table-row.table-data .as-table-col:hover {
	cursor: pointer;
  }

  .as-table-row.table-header {
	z-index: 999;
	background-color: #e6e6e6 !important;
  }

  .as-table-row.table-header.header-shadow {
	-webkit-box-shadow: 0px 1px 5px -2px rgba(0,0,0,0.75);
	-moz-box-shadow: 0px 1px 5px -2px rgba(0,0,0,0.75);
	box-shadow: 0px 1px 5px -2px rgba(0,0,0,0.75);
  }

  .as-table-row.table-header .as-table-col {
	font-weight: bold;
	text-align: center;
	height: 25px;
	font-size: 14px;
	overflow: hidden;
  }

  .app-modal {
	max-width: 90vw;
	max-height: 90vh;
	color: #2d3a46;
  }

  .app-modal-header  {
	display: block;
	width: 100%;
	height: 25px;
	padding: 10px;
  }

  .app-modal-header .fa-times {
	float: right;
	cursor: pointer;
  }

  .app-modal .app-modal-content {
	padding: 10px;
  }

  .app-modal .app-modal-content pre {
	padding: 5px 0px 0px 0px;
	margin: 0px;
	height: 100%;
	width: 100%;
	white-space: pre-wrap;
	word-wrap: break-word;
  }
</style>
