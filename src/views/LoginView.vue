<script>
import { ref } from 'vue'
import NavBar from '@/components/common/NavBar.vue'

export default {
  name: 'LoginView',
  components: {
    NavBar,
  },
  setup() {
    const username = ref('')
    const password = ref('')
    const errorMessage = ref('')
    const isLoading = ref(false)

    return {
      username,
      password,
      errorMessage,
      isLoading,
    }
  },
  methods: {
    async handleLogin() {
      this.isLoading = true
      this.errorMessage = ''

      if (!this.username || !this.password) {
        this.errorMessage = '아이디와 비밀번호를 모두 입력해주세요.'
        this.isLoading = false
        return
      }

      try {
        console.log('로그인 시도:', { id: this.username, password: this.password })

        // Clear token from localStorage before login to prevent authorization header issues
        localStorage.removeItem('token')

        const response = await this.$store.dispatch('auth/login', {
          id: this.username,
          password: this.password,
        })
        console.log('로그인 응답:', response)
        console.log('로그인 성공 상태:', this.$store.state.auth.isLoggedIn)

        // Redirect to the page the user was trying to access, or home
        const redirectPath = this.$route.query.redirect || '/'
        this.$router.push(redirectPath)
      } catch (error) {
        console.error('Login error:', error)
        // More detailed error logging
        if (error.response) {
          console.error('Error response data:', error.response.data)
          console.error('Error response status:', error.response.status)
          console.error('Error response headers:', error.response.headers)
        }
        if (error.response && error.response.data && error.response.data.error) {
          this.errorMessage = error.response.data.error
        } else {
          this.errorMessage = '로그인에 실패했습니다. 다시 시도해주세요.'
        }
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>

<template>
  <NavBar />
  <div class="login-view">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="login-card">
            <h1 class="login-title">로그인</h1>

            <div v-if="errorMessage" class="alert alert-danger">
              {{ errorMessage }}
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-group">
                <label for="username">아이디</label>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="form-control"
                  placeholder="아이디를 입력하세요"
                  required
                  :disabled="isLoading"
                />
              </div>

              <div class="form-group">
                <label for="password">비밀번호</label>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  class="form-control"
                  placeholder="비밀번호를 입력하세요"
                  required
                  :disabled="isLoading"
                />
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
                  {{ isLoading ? '로그인 중...' : '로그인' }}
                </button>
              </div>
            </form>

            <div class="login-footer">
              <p>아직 계정이 없으신가요? <router-link to="/register">회원가입</router-link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-view {
  min-height: 85vh;
  display: flex;
  align-items: center;
  padding: 3rem 0;
  background-color: var(--background-color);
}

.login-card {
  background-color: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  max-width: 550px;
  margin: 0 auto;
  border: 1px solid #eaeaea;
}

.login-title {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 2.5rem;
  font-weight: 700;
  font-size: 2.4rem;
}

.login-form {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.8rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.7rem;
  font-weight: 500;
  font-size: 1.05rem;
  color: var(--text-color);
}

.form-control {
  width: 100%;
  padding: 0.8rem 1rem;
  font-size: 1.05rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.2s;
}

.form-control:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.2);
  outline: none;
}

.btn-block {
  display: block;
  width: 100%;
  padding: 0.9rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 6px;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
}

.btn-block:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  color: var(--text-light);
  font-size: 1.05rem;
}

.login-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.login-footer a:hover {
  text-decoration: underline;
  color: var(--primary-dark);
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.8rem;
  border: 1px solid #f5c6cb;
  border-radius: 0.5rem;
  font-size: 1rem;
}

@media (min-width: 992px) {
  .login-card {
    padding: 3.5rem 4rem;
  }
}

@media (max-width: 768px) {
  .login-card {
    padding: 2rem;
    border-radius: 8px;
  }

  .login-title {
    font-size: 2rem;
    margin-bottom: 1.8rem;
  }

  .form-group {
    margin-bottom: 1.2rem;
  }

  .form-group label {
    font-size: 1rem;
  }

  .form-control {
    padding: 0.7rem 0.9rem;
    font-size: 1rem;
  }

  .btn-block {
    padding: 0.8rem 0;
    font-size: 1rem;
  }

  .btn-block:hover {
    transform: none;
    box-shadow: none;
  }
}
</style>
