import apiClient from './index'
import axios from 'axios'

export function loginApi(credentials) {
  console.log('Sending login request:', credentials)

  // Use the same format that works in Swagger
  return apiClient.post('/api/auth/login', credentials, {
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*', // Match Swagger's accept header
      Authorization: '', // Clear any existing token
    },
  })
}

export function registerApi(userData) {
  return apiClient.post('/api/auth/register', userData)
}

export function logoutApi() {
  return apiClient.post('/api/auth/logout')
}

export function checkLoginStatusApi() {
  return apiClient.get('/api/auth/check')
}
