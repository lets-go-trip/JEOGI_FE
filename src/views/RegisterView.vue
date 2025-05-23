<script>
import { ref } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { registerApi } from '@/api/auth'

export default {
  name: 'RegisterView',
  components: {
    NavBar,
  },
  setup() {
    const form = ref({
      id: '',
      password: '',
      passwordConfirm: '',
      name: '',
      email: '',
    })
    const errorMessage = ref('')
    const isLoading = ref(false)
    const successMessage = ref('')

    return {
      form,
      errorMessage,
      isLoading,
      successMessage,
    }
  },
  computed: {
    passwordsMatch() {
      return this.form.password === this.form.passwordConfirm
    },
    isFormValid() {
      return (
        this.form.id &&
        this.form.password &&
        this.form.passwordConfirm &&
        this.form.name &&
        this.form.email &&
        this.passwordsMatch
      )
    },
  },
  methods: {
    async handleRegister() {
      this.isLoading = true
      this.errorMessage = ''
      this.successMessage = ''

      if (!this.isFormValid) {
        this.errorMessage = !this.passwordsMatch
          ? '비밀번호가 일치하지 않습니다.'
          : '모든 필드를 입력해주세요.'
        this.isLoading = false
        return
      }

      try {
        const response = await registerApi({
          id: this.form.id,
          password: this.form.password,
          name: this.form.name,
          email: this.form.email,
        })

        this.successMessage = '회원가입에 성공했습니다. 로그인해주세요.'

        // Reset form
        this.form = {
          id: '',
          password: '',
          passwordConfirm: '',
          name: '',
          email: '',
        }

        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.$router.push('/login')
        }, 2000)
      } catch (error) {
        console.error('Registration error:', error)
        if (error.response && error.response.data && error.response.data.error) {
          this.errorMessage = error.response.data.error
        } else {
          this.errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.'
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
  <div class="register-view">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="register-card">
            <h1 class="register-title">회원가입</h1>

            <div v-if="errorMessage" class="alert alert-danger">
              {{ errorMessage }}
            </div>

            <div v-if="successMessage" class="alert alert-success">
              {{ successMessage }}
            </div>

            <form @submit.prevent="handleRegister" class="register-form">
              <div class="form-group">
                <label for="username">아이디 *</label>
                <input
                  id="username"
                  v-model="form.id"
                  type="text"
                  class="form-control"
                  placeholder="사용하실 아이디를 입력하세요"
                  required
                  :disabled="isLoading"
                />
              </div>

              <div class="form-group">
                <label for="email">이메일 *</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  class="form-control"
                  placeholder="이메일을 입력하세요"
                  required
                  :disabled="isLoading"
                />
              </div>

              <div class="form-group">
                <label for="name">닉네임 *</label>
                <input
                  id="name"
                  v-model="form.name"
                  type="text"
                  class="form-control"
                  placeholder="사용하실 닉네임을 입력하세요"
                  required
                  :disabled="isLoading"
                />
              </div>

              <div class="form-group">
                <label for="password">비밀번호 *</label>
                <input
                  id="password"
                  v-model="form.password"
                  type="password"
                  class="form-control"
                  placeholder="비밀번호를 입력하세요"
                  required
                  :disabled="isLoading"
                />
              </div>

              <div class="form-group">
                <label for="passwordConfirm">비밀번호 확인 *</label>
                <input
                  id="passwordConfirm"
                  v-model="form.passwordConfirm"
                  type="password"
                  class="form-control"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  :disabled="isLoading"
                />
                <div
                  v-if="form.password && form.passwordConfirm && !passwordsMatch"
                  class="text-danger mt-1"
                >
                  비밀번호가 일치하지 않습니다.
                </div>
              </div>

              <div class="form-actions">
                <button
                  type="submit"
                  class="btn btn-primary btn-block"
                  :disabled="isLoading || !isFormValid"
                >
                  {{ isLoading ? '처리 중...' : '회원가입' }}
                </button>
              </div>
            </form>

            <div class="register-footer">
              <p>이미 계정이 있으신가요? <router-link to="/login">로그인</router-link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-view {
  min-height: 80vh;
  padding: 3rem 0;
}

.register-card {
  background-color: white;
  border-radius: 8px;
  padding: 2.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.register-title {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 2rem;
  font-weight: 700;
}

.register-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.text-danger {
  color: #dc3545;
  font-size: 0.85rem;
}

.btn-block {
  display: block;
  width: 100%;
}

.register-footer {
  text-align: center;
  margin-top: 1.5rem;
  color: var(--text-light);
}

.register-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.register-footer a:hover {
  text-decoration: underline;
}
</style>
