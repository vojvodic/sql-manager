export default {
  methods: {
	locationReload(cache = false){
	  localStorage.setItem('appReloding', true);
	  window.location.reload(cache);
	}
  }
}
