<script>
import { onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'App',
  setup() {
    const store = useStore()

    onMounted(() => {
      // Restore login state from localStorage on app startup
      store.dispatch('auth/autoLogin')
    })
  },
}
</script>

<template>
  <RouterView />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
/* main.css is already imported in main.js - no need to import it here again */

#app {
  font-family: 'Noto Sans KR', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-color);
  min-height: 100vh;
}
</style>
