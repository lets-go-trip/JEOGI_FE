<script>
import NavBar from '@/components/common/NavBar.vue'

export default {
  name: 'HomeView',
  components: {
    NavBar,
  },
}
</script>

<template>
  <NavBar />
  <main class="home-view">
    <div class="hero">
      <div class="hero-content">
        <h1 class="hero-title">여행의 즐거움이 시작되는 곳</h1>
        <p class="hero-subtitle">
          관광지 정보, 채팅을 통한 정보 공유, 그리고 주차 예약까지 - 완벽한 여행 계획을 세워보세요
        </p>
        <div class="hero-buttons">
          <router-link to="/search" class="btn btn-primary btn-lg">여행지 검색하기</router-link>
          <router-link
            to="/register"
            class="btn btn-outline btn-lg"
            v-if="!$store.getters['auth/isLoggedIn']"
            >회원가입하기</router-link
          >
        </div>
      </div>
    </div>

    <section class="features">
      <div class="container">
        <h2 class="section-title">저기 어때?</h2>
        <div class="row">
          <div class="col-4">
            <div class="feature-card">
              <div class="feature-icon">🗺️</div>
              <h3>여기로 가자!</h3>
              <p>지도를 통해 다양한 여행지를 검색하고 정보를 확인해보세요.</p>
            </div>
          </div>
          <div class="col-4">
            <div class="feature-card">
              <div class="feature-icon">💬</div>
              <h3>지금 거기는 어때?</h3>
              <p>여행을 함께 계획하고 있는 사람들과 실시간으로 대화하세요.</p>
            </div>
          </div>
          <div class="col-4">
            <div class="feature-card">
              <div class="feature-icon">🅿️</div>
              <h3>주차도 걱정 없이!</h3>
              <p>인기 관광지의 주차 공간을 미리 예약하여 여행을 더욱 편리하게 즐기세요.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
}

.hero {
  height: 85vh; /* Taller hero section for desktop */
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url('https://via.placeholder.com/1920x1080?text=Korea+Travel+Landscape');
  background-size: cover;
  background-position: center;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-bottom: 4rem;
}

.hero-content {
  max-width: 900px; /* Wider content container for desktop */
  padding: 2rem;
}

.hero-title {
  font-size: 4rem; /* Larger title for desktop */
  margin-bottom: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.5px; /* Improved readability for large text */
}

.hero-subtitle {
  font-size: 1.7rem; /* Larger subtitle for desktop */
  margin-bottom: 2.5rem;
  line-height: 1.5;
  font-weight: 300; /* Lighter weight for subtitle */
}

.hero-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem; /* More space between buttons */
}

.btn-lg {
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  color: var(--primary-dark);
}

.features {
  padding: 5rem 0; /* More vertical space */
  background-color: #f8f9fa;
}

.feature-card {
  background-color: white;
  border-radius: 10px; /* Slightly more rounded corners */
  padding: 2.5rem; /* More padding for desktop */
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08); /* Enhanced shadow */
  height: 100%;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-15px); /* Enhanced hover effect */
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 3.5rem; /* Larger icons */
  margin-bottom: 1.8rem;
}

.feature-card h3 {
  font-size: 1.7rem; /* Larger headings */
  margin-bottom: 1.2rem;
  color: var(--primary-color);
  font-weight: 600;
}

.feature-card p {
  font-size: 1.1rem; /* Slightly larger text */
  line-height: 1.6;
}

.popular-destinations {
  padding: 4rem 0;
}

.destination-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: 100%;
  transition: transform 0.3s ease;
}

.destination-card:hover {
  transform: translateY(-10px);
}

.destination-image {
  height: 200px;
  background-size: cover;
  background-position: center;
}

.destination-card h3 {
  padding: 1rem 1rem 0.5rem;
  font-size: 1.25rem;
  color: var(--primary-color);
}

.destination-card p {
  padding: 0 1rem 1rem;
  color: var(--text-light);
}

@media (max-width: 991px) {
  .hero-title {
    font-size: 3.2rem;
  }

  .hero-subtitle {
    font-size: 1.4rem;
  }

  .feature-card {
    padding: 2rem;
  }

  .feature-icon {
    font-size: 3rem;
  }

  .feature-card h3 {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }

  .hero-buttons {
    flex-direction: column;
    gap: 0.7rem;
  }

  .features {
    padding: 3rem 0;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
}

@media (max-width: 576px) {
  .hero {
    height: 70vh;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-content {
    padding: 1.5rem;
  }
}
</style>
