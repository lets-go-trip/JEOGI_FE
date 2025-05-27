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

        // Handle LoginResponse format: {message, user: {username}}
        if (response.data.message === '로그인 성공' && response.data.user) {
          const userData = response.data.user
          commit('SET_USER', userData)
          commit('SET_LOGGED_IN', true)

          // Store user info in localStorage for persistence
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('isLoggedIn', 'true')
        }
        // Handle other response formats if needed
        else if (response.data.user) {
          commit('SET_USER', response.data.user)
          commit('SET_LOGGED_IN', true)

          localStorage.setItem('user', JSON.stringify(response.data.user))
          localStorage.setItem('isLoggedIn', 'true')

          if (response.data.token) {
            commit('SET_TOKEN', response.data.token)
            localStorage.setItem('token', response.data.token)
          }
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
        localStorage.removeItem('user')
        localStorage.removeItem('isLoggedIn')
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
      const user = localStorage.getItem('user')
      const isLoggedIn = localStorage.getItem('isLoggedIn')

      if (token) {
        commit('SET_TOKEN', token)
      }

      if (user && isLoggedIn === 'true') {
        try {
          const userData = JSON.parse(user)
          commit('SET_USER', userData)
          commit('SET_LOGGED_IN', true)
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          localStorage.removeItem('user')
          localStorage.removeItem('isLoggedIn')
        }
      }
    },
  },
  getters: {
    isLoggedIn: (state) => state.isLoggedIn,
    currentUser: (state) => state.user,
    token: (state) => state.token,
  },
}
