<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { getAttractionDetail } from '@/api/attractions'
import { getAvailableParkingSpaces, createParkingReservation } from '@/api/reservations'
import { connectChatRoom, disconnectChat, sendChatMessage, getChatMessages } from '@/api/chat'

export default {
  name: 'AttractionDetailView',
  components: {
    NavBar,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const attraction = ref(null)
    const isLoading = ref(true)
    const errorMessage = ref('')
    const chatMessages = ref([])
    const newMessage = ref('')
    const chatRoomId = ref('')
    const parkingSpaces = ref(null)
    const stompClient = ref(null)

    // Reservation form
    const showReservationForm = ref(false)
    const reservationDate = ref('')
    const startTime = ref('')
    const endTime = ref('')
    const reservationSuccess = ref(false)
    const reservationError = ref('')

    return {
      attraction,
      isLoading,
      errorMessage,
      chatMessages,
      newMessage,
      chatRoomId,
      parkingSpaces,
      stompClient,
      showReservationForm,
      reservationDate,
      startTime,
      endTime,
      reservationSuccess,
      reservationError,
    }
  },
  computed: {
    isLoggedIn() {
      return this.$store.getters['auth/isLoggedIn']
    },
    currentUser() {
      return this.$store.getters['auth/currentUser']
    },
    userName() {
      return this.currentUser?.nickname || this.currentUser?.username || 'Anonymous'
    },
    formattedReservationDateTime() {
      if (!this.reservationDate || !this.startTime || !this.endTime) return null

      const startDateTime = `${this.reservationDate}T${this.startTime}:00`
      const endDateTime = `${this.reservationDate}T${this.endTime}:00`

      return {
        startDateTime,
        endDateTime,
      }
    },
    todayDate() {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    parkingLotId() {
      return this.attraction?.parkingLot?.id
    },
  },
  methods: {
    async fetchAttractionDetail() {
      this.isLoading = true

      try {
        const response = await getAttractionDetail(this.id)
        this.attraction = response.data

        // Set chat room ID based on attraction ID
        this.chatRoomId = `attraction_${this.id}`

        // Fetch parking information if available
        if (this.attraction.parkingLot) {
          this.fetchParkingSpaces()
        }

        // Connect to chat room
        this.connectToChat()
      } catch (error) {
        console.error('Error fetching attraction details:', error)
        this.errorMessage = '여행지 정보를 불러오는 중 오류가 발생했습니다.'
      } finally {
        this.isLoading = false
      }
    },

    async fetchParkingSpaces() {
      if (!this.parkingLotId) return

      try {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day}`

        const response = await getAvailableParkingSpaces(this.parkingLotId, {
          startDateTime: `${formattedDate}T00:00:00`,
          endDateTime: `${formattedDate}T23:59:59`,
        })

        this.parkingSpaces = response.data
      } catch (error) {
        console.error('Error fetching parking spaces:', error)
      }
    },

    async connectToChat() {
      if (!this.isLoggedIn || !this.chatRoomId) return

      try {
        // Fetch existing messages
        const response = await getChatMessages(this.chatRoomId)
        this.chatMessages = response.data.messages || []

        // Connect to chat with WebSocket
        this.stompClient = connectChatRoom(this.chatRoomId, this.onMessageReceived)

        // Send enter message
        setTimeout(() => {
          this.sendEnterMessage()
        }, 1000)
      } catch (error) {
        console.error('Error connecting to chat:', error)
      }
    },

    onMessageReceived(message) {
      this.chatMessages.push(message)
      this.scrollToBottom()
    },

    sendEnterMessage() {
      if (!this.stompClient || !this.chatRoomId) return

      sendChatMessage({
        type: 'ENTER',
        roomId: this.chatRoomId,
        sender: this.userName,
        message: `${this.userName}님이 입장하셨습니다.`,
      })
    },

    sendMessage() {
      if (!this.newMessage.trim() || !this.stompClient) return

      sendChatMessage({
        type: 'TALK',
        roomId: this.chatRoomId,
        sender: this.userName,
        message: this.newMessage,
      })

      this.newMessage = ''
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatMessages
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
      })
    },

    async makeReservation() {
      if (!this.isLoggedIn || !this.parkingLotId) return

      if (!this.formattedReservationDateTime) {
        this.reservationError = '예약 날짜와 시간을 모두 선택해주세요.'
        return
      }

      this.reservationError = ''
      this.reservationSuccess = false

      try {
        const response = await createParkingReservation(
          this.parkingLotId,
          this.formattedReservationDateTime,
        )
        this.reservationSuccess = true
        this.showReservationForm = false

        // Refresh parking spaces
        this.fetchParkingSpaces()
      } catch (error) {
        console.error('Reservation error:', error)
        if (error.response && error.response.data && error.response.data.error) {
          this.reservationError = error.response.data.error
        } else {
          this.reservationError = '주차 예약에 실패했습니다. 다시 시도해주세요.'
        }
      }
    },

    toggleReservationForm() {
      this.showReservationForm = !this.showReservationForm
      this.reservationError = ''
      this.reservationSuccess = false

      if (this.showReservationForm) {
        this.reservationDate = this.todayDate
      }
    },
  },
  mounted() {
    this.fetchAttractionDetail()
  },
  beforeUnmount() {
    disconnectChat()
  },
  watch: {
    id() {
      this.fetchAttractionDetail()
    },
  },
}
</script>

<template>
  <NavBar />
  <div class="attraction-detail-view">
    <div v-if="isLoading" class="loading-container">
      <p>여행지 정보를 불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage" class="error-container">
      <div class="alert alert-danger">{{ errorMessage }}</div>
      <router-link to="/search" class="btn btn-primary">여행지 검색으로 돌아가기</router-link>
    </div>

    <div v-else-if="attraction" class="detail-container">
      <div class="attraction-header">
        <div class="container">
          <h1 class="attraction-title">{{ attraction.title }}</h1>
          <div class="attraction-meta">
            <span class="attraction-location">{{ attraction.addr1 }} {{ attraction.addr2 }}</span>
            <span class="attraction-category" v-if="attraction.contentTypes">{{
              attraction.contentTypes.typeName
            }}</span>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="row">
          <div class="col-md-8">
            <div class="attraction-main">
              <div class="attraction-image" v-if="attraction.firstimage">
                <img :src="attraction.firstimage" :alt="attraction.title" />
              </div>

              <div class="attraction-description" v-if="attraction.overview">
                <h2>여행지 소개</h2>
                <p>{{ attraction.overview }}</p>
              </div>

              <div class="attraction-info">
                <h2>상세 정보</h2>
                <div class="info-item" v-if="attraction.tel">
                  <strong>전화번호:</strong> {{ attraction.tel }}
                </div>
                <div class="info-item" v-if="attraction.homepage">
                  <strong>홈페이지:</strong>
                  <a :href="attraction.homepage" target="_blank" rel="noopener noreferrer">{{
                    attraction.homepage
                  }}</a>
                </div>
                <div class="info-item" v-if="attraction.zipcode">
                  <strong>우편번호:</strong> {{ attraction.zipcode }}
                </div>
              </div>

              <div class="attraction-map" v-if="attraction.mapx && attraction.mapy">
                <h2>위치 정보</h2>
                <div id="detail-map" class="detail-map-container"></div>
              </div>
            </div>
          </div>

          <div class="col-md-4">
            <div class="attraction-sidebar">
              <div class="parking-info" v-if="parkingLotId">
                <h2>주차장 정보</h2>
                <div v-if="parkingSpaces !== null" class="parking-availability">
                  <p class="available-spaces">
                    잔여 주차 공간: <strong>{{ parkingSpaces }}</strong> /
                    {{ attraction.parkingLot.totalCount }}
                  </p>
                  <button
                    @click="toggleReservationForm"
                    class="btn btn-primary btn-block"
                    :disabled="!isLoggedIn"
                  >
                    주차 예약하기
                  </button>
                  <p v-if="!isLoggedIn" class="text-muted mt-2">예약하려면 로그인해주세요.</p>
                </div>

                <div v-if="showReservationForm" class="reservation-form mt-3">
                  <h3>주차 예약</h3>

                  <div v-if="reservationError" class="alert alert-danger">
                    {{ reservationError }}
                  </div>

                  <div v-if="reservationSuccess" class="alert alert-success">
                    주차 예약이 완료되었습니다.
                  </div>

                  <div class="form-group">
                    <label for="reservationDate">날짜</label>
                    <input
                      id="reservationDate"
                      v-model="reservationDate"
                      type="date"
                      class="form-control"
                      :min="todayDate"
                    />
                  </div>

                  <div class="form-group">
                    <label for="startTime">시작 시간</label>
                    <input id="startTime" v-model="startTime" type="time" class="form-control" />
                  </div>

                  <div class="form-group">
                    <label for="endTime">종료 시간</label>
                    <input id="endTime" v-model="endTime" type="time" class="form-control" />
                  </div>

                  <div class="form-actions">
                    <button @click="makeReservation" class="btn btn-primary btn-block">
                      예약하기
                    </button>
                    <button @click="toggleReservationForm" class="btn btn-outline btn-block mt-2">
                      취소
                    </button>
                  </div>
                </div>
              </div>

              <div class="chat-container">
                <h2>실시간 채팅</h2>

                <div v-if="!isLoggedIn" class="login-prompt">
                  <p>채팅에 참여하려면 로그인해주세요.</p>
                  <router-link to="/login" class="btn btn-primary btn-block"
                    >로그인하기</router-link
                  >
                </div>

                <div v-else class="chat-box">
                  <div ref="chatMessages" class="chat-messages">
                    <div
                      v-for="(message, index) in chatMessages"
                      :key="index"
                      class="chat-message"
                      :class="{
                        'system-message': message.type === 'ENTER',
                        'my-message': message.sender === userName,
                      }"
                    >
                      <div v-if="message.type === 'ENTER'" class="message-content system">
                        {{ message.message }}
                      </div>
                      <div v-else class="message-content">
                        <div class="message-sender">{{ message.sender }}</div>
                        <div class="message-text">{{ message.message }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="chat-input">
                    <input
                      v-model="newMessage"
                      type="text"
                      class="form-control"
                      placeholder="메시지를 입력하세요"
                      @keyup.enter="sendMessage"
                    />
                    <button
                      @click="sendMessage"
                      class="btn btn-primary"
                      :disabled="!newMessage.trim()"
                    >
                      전송
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.attraction-detail-view {
  min-height: 100vh;
  background-color: var(--background-color);
}

.loading-container,
.error-container {
  height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.attraction-header {
  background-color: var(--primary-color);
  color: white;
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.attraction-title {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.attraction-meta {
  display: flex;
  gap: 1rem;
  font-size: 1.1rem;
}

.attraction-category {
  background-color: var(--primary-dark);
  padding: 0.2rem 0.7rem;
  border-radius: 4px;
}

.attraction-main {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.attraction-image img {
  width: 100%;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.attraction-description,
.attraction-info,
.attraction-map {
  margin-bottom: 2rem;
}

.attraction-description h2,
.attraction-info h2,
.attraction-map h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.info-item {
  margin-bottom: 0.5rem;
}

.detail-map-container {
  height: 300px;
  border-radius: 4px;
  overflow: hidden;
}

.attraction-sidebar {
  position: sticky;
  top: 2rem;
}

.parking-info,
.chat-container {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.parking-info h2,
.chat-container h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.available-spaces {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.reservation-form h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: var(--primary-dark);
}

.chat-box {
  display: flex;
  flex-direction: column;
  height: 400px;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.chat-message {
  margin-bottom: 1rem;
}

.message-content {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 18px;
  max-width: 80%;
  background-color: #e9e9eb;
}

.my-message .message-content {
  float: right;
  background-color: var(--primary-light);
  color: white;
}

.message-sender {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}

.system-message .message-content {
  background-color: rgba(0, 0, 0, 0.1);
  color: var(--text-light);
  text-align: center;
  width: 100%;
  padding: 0.3rem;
  font-size: 0.9rem;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
}

.login-prompt {
  text-align: center;
  padding: 1rem;
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
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
  .attraction-header {
    padding: 1.5rem 0;
  }

  .attraction-title {
    font-size: 2rem;
  }

  .attraction-main,
  .parking-info,
  .chat-container {
    padding: 1rem;
  }

  .chat-box {
    height: 300px;
  }
}
</style>
