import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import store from '../store'

// Lazy-loaded components
const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')
const SearchView = () => import('../views/SearchView.vue')
const AttractionDetailView = () => import('../views/AttractionDetailView.vue')
const MyReservationsView = () => import('../views/MyReservationsView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true },
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/attraction/:id',
      name: 'attractionDetail',
      component: AttractionDetailView,
      props: true,
    },
    {
      path: '/my-reservations',
      name: 'myReservations',
      component: MyReservationsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFoundView,
    },
  ],
  scrollBehavior() {
    // Always scroll to top
    return { top: 0 }
  },
})

// Navigation Guards
router.beforeEach((to, from, next) => {
  // Check if the route requires authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!store.getters['auth/isLoggedIn']) {
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  }
  // Check if the route requires guest (unauthenticated) access only
  else if (to.matched.some((record) => record.meta.requiresGuest)) {
    if (store.getters['auth/isLoggedIn']) {
      next({ name: 'home' })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
