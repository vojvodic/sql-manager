window.Vue = require('vue');
window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import VModal from 'vue-js-modal';
Vue.use(VModal,{ dynamicDefaults: {draggable: true,resizable: true} });

import RootComponent from './components/RootComponent.vue';

window.CodeMirror = require('codemirror');
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql.js';
import 'codemirror/addon/runmode/runmode.js';
import 'codemirror/addon/lint/lint.js';
import 'codemirror/addon/display/placeholder.js';

new Vue({
  el: '#app',
  components: {
	'root'   : RootComponent
  }
})
