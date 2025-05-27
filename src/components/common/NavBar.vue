<template>
  <nav class="navbar">
    <div class="container">
      <div class="navbar-brand">
        <router-link to="/" class="logo">
          <span class="logo-text">TripChat</span>
        </router-link>
      </div>

      <div class="navbar-menu" :class="{ 'is-active': isActive }">
        <div class="navbar-start">
          <router-link to="/" class="navbar-item">홈</router-link>
          <router-link to="/search" class="navbar-item">여행지 검색</router-link>
          <router-link to="/my-reservations" class="navbar-item">내 예약</router-link>
        </div>

        <div class="navbar-end">
          <div class="navbar-item" v-if="isLoggedIn">
            <span class="user-name mr-2">{{ userName }} 님</span>
            <button @click="logout" class="btn btn-outline btn-sm">로그아웃</button>
          </div>
          <div v-else class="navbar-item">
            <router-link to="/login" class="btn btn-outline mr-2">로그인</router-link>
            <router-link to="/register" class="btn btn-primary">회원가입</router-link>
          </div>
        </div>
      </div>

      <div class="navbar-burger" @click="toggleMenu" :class="{ 'is-active': isActive }">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {
      isActive: false,
    }
  },
  computed: {
    isLoggedIn() {
      return this.$store.state.auth.isLoggedIn
    },
    userName() {
      return this.$store.state.auth.user?.nickname || this.$store.state.auth.user?.username
    },
  },
  methods: {
    toggleMenu() {
      this.isActive = !this.isActive
    },
    logout() {
      this.$store.dispatch('auth/logout')
      this.$router.push('/login')
    },
  },
}
</script>

<style scoped>
.navbar {
  background-color: var(--primary-color);
  padding: 0.5rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 999;
}

.navbar-brand {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
}

.logo-text {
  margin-left: 0.5rem;
}

.navbar-menu {
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
}

.navbar-start,
.navbar-end {
  display: flex;
  align-items: center;
}

.navbar-item {
  color: white;
  padding: 0.7rem 1rem;
  text-decoration: none;
  transition: background-color 0.3s;
  border-radius: 4px;
  margin: 0 0.2rem;
}

.navbar-item:hover {
  background-color: var(--primary-dark);
}

.user-name {
  color: white;
  margin-right: 1rem;
}

.mr-2 {
  margin-right: 0.5rem;
}

.navbar-burger {
  display: none;
  cursor: pointer;
  height: 3.25rem;
  width: 3.25rem;
  margin-left: auto;
  position: relative;
}

.navbar-burger span {
  background-color: white;
  display: block;
  height: 2px;
  width: 24px;
  position: absolute;
  left: calc(50% - 12px);
  transition: all 0.3s;
}

.navbar-burger span:nth-child(1) {
  top: calc(50% - 8px);
}

.navbar-burger span:nth-child(2) {
  top: calc(50% - 1px);
}

.navbar-burger span:nth-child(3) {
  top: calc(50% + 6px);
}

.navbar-burger.is-active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.navbar-burger.is-active span:nth-child(2) {
  opacity: 0;
}

.navbar-burger.is-active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

@media (min-width: 769px) {
  .navbar {
    height: 70px; /* Taller navbar for desktop */
  }

  .container {
    height: 100%;
    display: flex;
    align-items: center;
  }

  .navbar-menu {
    display: flex !important;
    justify-content: space-between;
    flex-grow: 1;
    margin-left: 2rem; /* More space between logo and menu items */
  }

  .logo-text {
    font-size: 1.8rem; /* Larger logo text */
  }

  .navbar-burger {
    display: none;
  }

  .navbar-item {
    padding: 0.7rem 1.2rem; /* Larger clickable area */
    font-size: 1.05rem; /* Slightly larger text */
    transition: all 0.2s ease-in-out;
  }

  .navbar-item:hover {
    background-color: var(--primary-dark);
    transform: translateY(-2px); /* Subtle hover effect */
  }
}

@media (max-width: 768px) {
  .navbar-menu {
    display: none;
    flex-direction: column;
    width: 100%;
    position: absolute;
    top: 100%;
    left: 0;
    background-color: var(--primary-color);
    padding: 0.5rem 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .navbar-menu.is-active {
    display: flex;
  }

  .navbar-start,
  .navbar-end {
    flex-direction: column;
    width: 100%;
  }

  .navbar-item {
    width: 100%;
    padding: 0.7rem 1.5rem;
  }

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .navbar-burger {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  }
}
</style>
