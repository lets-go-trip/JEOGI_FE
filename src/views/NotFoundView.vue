<script>
import NavBar from '@/components/common/NavBar.vue'

export default {
  name: 'NotFoundView',
  components: {
    NavBar,
  },
}
</script>

<template>
  <NavBar />
  <div class="not-found-view">
    <div class="container">
      <div class="not-found-content">
        <h1 class="not-found-title">404</h1>
        <h2 class="not-found-subtitle">페이지를 찾을 수 없습니다</h2>
        <p class="not-found-message">요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.</p>
        <router-link to="/" class="btn btn-primary btn-lg">홈으로 돌아가기</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  margin: 0 auto;
}

.not-found-title {
  font-size: 8rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 1rem;
}

.not-found-subtitle {
  font-size: 2rem;
  color: var(--primary-dark);
  margin-bottom: 1.5rem;
}

.not-found-message {
  color: var(--text-light);
  font-size: 1.2rem;
  margin-bottom: 2rem;
}

.btn-lg {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
}
</style>
