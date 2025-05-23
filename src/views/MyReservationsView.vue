<script>
import { ref, onMounted } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { getMyReservations, cancelReservation } from '@/api/reservations'

export default {
  name: 'MyReservationsView',
  components: {
    NavBar,
  },
  setup() {
    const reservations = ref([])
    const isLoading = ref(true)
    const errorMessage = ref('')
    const cancelSuccess = ref(false)

    return {
      reservations,
      isLoading,
      errorMessage,
      cancelSuccess,
    }
  },
  computed: {
    hasReservations() {
      return this.reservations.length > 0
    },
  },
  methods: {
    async fetchReservations() {
      this.isLoading = true
      this.errorMessage = ''

      try {
        const response = await getMyReservations()
        this.reservations = response.data.reservations || []
      } catch (error) {
        console.error('Error fetching reservations:', error)
        this.errorMessage = '예약 정보를 불러오는 중 오류가 발생했습니다.'
      } finally {
        this.isLoading = false
      }
    },

    formatDate(dateTimeString) {
      if (!dateTimeString) return ''

      const date = new Date(dateTimeString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      return `${year}년 ${month}월 ${day}일`
    },

    formatTime(dateTimeString) {
      if (!dateTimeString) return ''

      const date = new Date(dateTimeString)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')

      return `${hours}:${minutes}`
    },

    async handleCancelReservation(reservationId) {
      if (!confirm('정말로 이 예약을 취소하시겠습니까?')) return

      try {
        await cancelReservation(reservationId)

        // Remove the cancelled reservation from the list
        this.reservations = this.reservations.filter((res) => res.id !== reservationId)

        this.cancelSuccess = true
        setTimeout(() => {
          this.cancelSuccess = false
        }, 3000)
      } catch (error) {
        console.error('Error cancelling reservation:', error)
        this.errorMessage = '예약 취소 중 오류가 발생했습니다.'
      }
    },

    viewAttractionDetails(attractionId) {
      this.$router.push(`/attraction/${attractionId}`)
    },
  },
  mounted() {
    this.fetchReservations()
  },
}
</script>

<template>
  <NavBar />
  <div class="my-reservations-view">
    <div class="container">
      <h1 class="page-title">내 주차 예약 관리</h1>

      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <div v-if="cancelSuccess" class="alert alert-success">예약이 성공적으로 취소되었습니다.</div>

      <div v-if="isLoading" class="loading-container">
        <p>예약 정보를 불러오는 중...</p>
      </div>

      <div v-else-if="!hasReservations" class="no-reservations">
        <p>현재 예약 내역이 없습니다.</p>
        <router-link to="/search" class="btn btn-primary">여행지 검색하기</router-link>
      </div>

      <div v-else class="reservations-container">
        <div class="reservation-card" v-for="reservation in reservations" :key="reservation.id">
          <div class="reservation-header">
            <h2 class="reservation-title">{{ reservation.parkingLot.attraction.title }}</h2>
            <span class="reservation-id">예약번호: #{{ reservation.id }}</span>
          </div>

          <div class="reservation-body">
            <div class="reservation-details">
              <div class="detail-item">
                <span class="detail-label">예약 날짜:</span>
                <span class="detail-value">{{
                  formatDate(reservation.reservationPeriod.startDateTime)
                }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">예약 시간:</span>
                <span class="detail-value">
                  {{ formatTime(reservation.reservationPeriod.startDateTime) }} ~
                  {{ formatTime(reservation.reservationPeriod.endDateTime) }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">주소:</span>
                <span class="detail-value">
                  {{ reservation.parkingLot.attraction.addr1 }}
                  {{ reservation.parkingLot.attraction.addr2 }}
                </span>
              </div>

              <div class="detail-item">
                <span class="detail-label">예약 일시:</span>
                <span class="detail-value">{{ formatDate(reservation.createdAt) }}</span>
              </div>
            </div>

            <div class="reservation-actions">
              <button
                @click="viewAttractionDetails(reservation.parkingLot.attraction.id)"
                class="btn btn-outline"
              >
                여행지 정보 보기
              </button>

              <button @click="handleCancelReservation(reservation.id)" class="btn btn-danger">
                예약 취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-reservations-view {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 2rem 0;
}

.page-title {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 2rem;
  font-weight: 700;
}

.loading-container,
.no-reservations {
  text-align: center;
  padding: 3rem 0;
}

.no-reservations p {
  margin-bottom: 1.5rem;
  color: var(--text-light);
}

.reservation-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.reservation-header {
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reservation-title {
  font-size: 1.3rem;
  margin: 0;
  font-weight: 600;
}

.reservation-id {
  font-size: 0.9rem;
  background-color: var(--primary-dark);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.reservation-body {
  padding: 1.5rem;
}

.reservation-details {
  margin-bottom: 1.5rem;
}

.detail-item {
  margin-bottom: 0.5rem;
  display: flex;
}

.detail-label {
  width: 100px;
  font-weight: 600;
  color: var(--text-light);
}

.reservation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-danger {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
  border-color: #bd2130;
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

@media (max-width: 768px) {
  .reservation-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .reservation-id {
    margin-top: 0.5rem;
  }

  .detail-item {
    flex-direction: column;
    margin-bottom: 1rem;
  }

  .detail-label {
    width: 100%;
    margin-bottom: 0.25rem;
  }

  .reservation-actions {
    flex-direction: column;
  }

  .reservation-actions .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
