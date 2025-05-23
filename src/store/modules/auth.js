import { loginApi, logoutApi, checkLoginStatusApi } from '@/api/auth'

export default {
  namespaced: true,
  state: {
    isLoggedIn: false,
    user: null,
    token: null,
  },
  mutations: {
    SET_LOGGED_IN(state, isLoggedIn) {
      state.isLoggedIn = isLoggedIn
    },
    SET_USER(state, user) {
      state.user = user
    },
    SET_TOKEN(state, token) {
      state.token = token
    },
    CLEAR_AUTH(state) {
      state.isLoggedIn = false
      state.user = null
      state.token = null
    },
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await loginApi(credentials)
        console.log('Login API response:', response.data)

        // Handle different response formats
        // If response contains user object, use it
        if (response.data.user) {
          commit('SET_USER', response.data.user)
          commit('SET_LOGGED_IN', true)

          // If response contains token, store it
          if (response.data.token) {
            commit('SET_TOKEN', response.data.token)
            localStorage.setItem('token', response.data.token)
          }
        }
        // Fallback for backend that returns {message, user} format
        else if (response.data.message === '로그인 성공') {
          commit('SET_USER', { username: response.data.user?.username || 'user' })
          commit('SET_LOGGED_IN', true)
        }

        return Promise.resolve(response)
      } catch (error) {
        console.error('Login error in store:', error)
        return Promise.reject(error)
      }
    },

    async logout({ commit }) {
      try {
        await logoutApi()
        commit('CLEAR_AUTH')
        localStorage.removeItem('token')
        return Promise.resolve()
      } catch (error) {
        return Promise.reject(error)
      }
    },

    async checkLoginStatus({ commit }) {
      try {
        const response = await checkLoginStatusApi()
        const { user } = response.data

        if (user) {
          commit('SET_USER', user)
          commit('SET_LOGGED_IN', true)
        } else {
          commit('CLEAR_AUTH')
        }

        return Promise.resolve(response)
      } catch (error) {
        commit('CLEAR_AUTH')
        return Promise.reject(error)
      }
    },

    autoLogin({ commit }) {
      const token = localStorage.getItem('token')
      if (token) {
        commit('SET_TOKEN', token)
        commit('SET_LOGGED_IN', true)
        // You might want to validate the token or get user data here
      }
    },
  },
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    currentUser: (state) => state.user,
    token: (state) => state.token,
  },
}
