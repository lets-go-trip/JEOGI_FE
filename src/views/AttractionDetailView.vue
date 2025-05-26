<template>
  <div>
    <NavBar />
    <div class="attraction-detail-container">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading">
        <p>여행지 정보를 불러오는 중...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="error">
        <p>{{ errorMessage }}</p>
      </div>

      <!-- Main Content -->
      <div v-else-if="attraction" class="main-content">
        <!-- Attraction Details Section -->
        <div class="attraction-section">
          <div class="attraction-card">
            <h1 class="attraction-title">{{ attraction.title }}</h1>
            <div class="attraction-info">
              <img
                :src="
                  attraction.imgUrl && attraction.imgUrl.length
                    ? attraction.imgUrl
                    : 'http://lsh318204.cafe24.com/wp-content/uploads/kboard_attached/8/201906/5cf728d931fab7574308-600x338.jpg'
                "
                alt="Attraction Image"
                class="attraction-image"
              />
              <p><strong>주소:</strong> {{ attraction.address }}</p>
              <p v-if="attraction.overview"><strong>설명:</strong> {{ attraction.overview }}</p>
              <p v-if="attraction.tel"><strong>전화번호:</strong> {{ attraction.tel }}</p>
              <p v-if="attraction.homepage">
                <strong>홈페이지:</strong>
                <a :href="attraction.homepage" target="_blank">{{ attraction.homepage }}</a>
              </p>
            </div>
          </div>
        </div>

        <!-- Chat Section -->
        <div class="chat-section">
          <div class="chat-container">
            <div class="chat-header">
              <h3>실시간 채팅</h3>
              <p v-if="!isLoggedIn" class="login-notice">채팅에 참여하려면 로그인이 필요합니다.</p>
            </div>

            <!-- Chat Messages -->
            <div class="chat-messages" ref="chatMessagesContainer" @scroll="handleScroll">
              <!-- Loading Indicator -->
              <div v-if="isLoadingHistory" class="loading-indicator">
                <small class="text-muted">이전 메시지를 불러오는 중...</small>
              </div>

              <div
                v-for="message in chatMessages"
                :key="`message-${message.id}-${message.timestamp}`"
                :class="[
                  'message',
                  {
                    'own-message': message.isMe && message.type === 'TALK',
                    'other-message': !message.isMe && message.type === 'TALK',
                    'system-message': message.type === 'ENTER' || message.type === 'LEAVE',
                  },
                ]"
              >
                <div
                  :class="{
                    'message-content': message.type === 'TALK',
                    'system-content': message.type === 'ENTER' || message.type === 'LEAVE',
                  }"
                >
                  <template v-if="message.type === 'TALK'">
                    <div class="message-header">
                      <span class="username">{{ message.sender }}</span>
                      <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
                    </div>
                    <div class="message-text">{{ message.message }}</div>
                  </template>
                  <template v-else>
                    <div class="system-text">{{ message.message }}</div>
                  </template>
                </div>
              </div>

              <!-- No messages state -->
              <div v-if="chatMessages.length === 0 && !isLoadingHistory" class="no-messages">
                <p>아직 메시지가 없습니다. 첫 번째 메시지를 보내보세요!</p>
              </div>
            </div>

            <!-- Chat Input -->
            <div v-if="isLoggedIn" class="chat-input">
              <div v-if="!isConnected" class="connection-status">
                <small class="text-warning">채팅 서버에 연결 중...</small>
              </div>
              <div class="input-group">
                <input
                  v-model="newMessage"
                  @keypress.enter="sendMessage"
                  :disabled="!isConnected"
                  placeholder="메시지를 입력하세요..."
                  class="message-input"
                />
                <button
                  @click="sendMessage"
                  :disabled="!newMessage.trim() || !isConnected"
                  class="send-button"
                >
                  전송
                </button>
              </div>
            </div>

            <!-- Login prompt for non-authenticated users -->
            <div v-else class="login-prompt">
              <p>채팅에 참여하려면 로그인이 필요합니다.</p>
              <router-link to="/login" class="login-button">로그인하기</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import NavBar from '@/components/common/NavBar.vue'
import { getAttractionDetail } from '@/api/attractions'
import { connectChatRoom, disconnectChat, sendChatMessage, getChatMessages } from '@/api/chat'

export default {
  name: 'AttractionDetailView',
  components: {
    NavBar,
  },
  setup() {
    const route = useRoute()
    const store = useStore()

    // State
    const attraction = ref(null)
    const isLoading = ref(true)
    const errorMessage = ref('')
    const chatMessages = ref([])
    const newMessage = ref('')
    const stompClient = ref(null)
    const chatMessagesContainer = ref(null)
    const chatRoomId = ref(null)
    const isLoadingHistory = ref(false)
    const cursor = ref('latest')
    const hasMoreMessages = ref(true)
    const isConnected = ref(false)

    // Computed
    const attractionId = computed(() => route.params.id)
    const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])
    const currentUser = computed(() => store.getters['auth/currentUser'])
    const userName = computed(() => currentUser.value?.username || 'Anonymous')

    // Methods
    const fetchAttractionDetail = async () => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        const response = await getAttractionDetail(attractionId.value)

        attraction.value = response.data
        chatRoomId.value = attractionId.value

        if (isLoggedIn.value) {
          await connectToChat()
        }
      } catch (error) {
        console.error('Error fetching attraction details:', error)

        if (error.response?.status === 401) {
          errorMessage.value = '로그인하면 더 많은 정보와 채팅 기능을 이용할 수 있습니다.'
          attraction.value = {
            id: attractionId.value,
            title: '관광지 정보',
            description: '로그인 후 상세 정보를 확인하세요.',
          }
        } else {
          errorMessage.value = '여행지 정보를 불러오는 중 오류가 발생했습니다.'
        }
      } finally {
        isLoading.value = false
      }
    }

    const connectToChat = async () => {
      if (!isLoggedIn.value || !chatRoomId.value) return

      try {
        // Load initial messages
        await loadChatMessages('latest')

        // Connect to WebSocket
        stompClient.value = connectChatRoom(chatRoomId.value, onMessageReceived)

        // Send ENTER message after connection
        setTimeout(() => {
          sendEnterMessage()
        }, 1000)

        isConnected.value = true
      } catch (error) {
        console.error('Error connecting to chat:', error)
        isConnected.value = false
      }
    }

    const loadChatMessages = async (cursorValue = 'latest') => {
      if (isLoadingHistory.value || !hasMoreMessages.value) return

      try {
        isLoadingHistory.value = true
        const response = await getChatMessages(chatRoomId.value, cursorValue)

        const data = response.data
        const messages = data.chatMessageList || []

        if (messages.length === 0) {
          hasMoreMessages.value = false
          return
        }

        // Process messages with isMe flag and ensure all properties are present
        const processedMessages = messages.map((message) => ({
          id: message.id,
          sender: message.sender,
          message: message.message,
          type: message.type || 'TALK',
          roomId: message.roomId,
          isMe: message.sender === userName.value,
          timestamp: message.timestamp || new Date().toISOString(),
        }))

        // Find the lowest ID for cursor
        const lowestId = Math.min(...messages.map((m) => m.id))

        // Check if we've reached the beginning (ID = 1)
        if (lowestId === 1) {
          hasMoreMessages.value = false
        }

        if (cursorValue === 'latest') {
          // Initial load - sort by ID ascending (oldest to newest)
          const sortedMessages = processedMessages.sort((a, b) => a.id - b.id)
          chatMessages.value = [...sortedMessages] // Create new array for reactivity
          cursor.value = lowestId
          await scrollToBottom()
        } else {
          // Loading previous messages - prepend to beginning
          const scrollHeight = chatMessagesContainer.value?.scrollHeight || 0

          // Sort old messages and prepend them
          const sortedOldMessages = processedMessages.sort((a, b) => a.id - b.id)

          // Create a new array to trigger Vue reactivity properly
          const updatedMessages = [...sortedOldMessages, ...chatMessages.value]
          chatMessages.value = updatedMessages
          cursor.value = lowestId

          // Maintain scroll position
          await nextTick()
          if (chatMessagesContainer.value) {
            const newScrollHeight = chatMessagesContainer.value.scrollHeight
            chatMessagesContainer.value.scrollTop = newScrollHeight - scrollHeight
          }
        }
      } catch (error) {
        console.error('Error loading chat messages:', error)
        if (cursorValue === 'latest') {
          chatMessages.value = []
        }
      } finally {
        isLoadingHistory.value = false
      }
    }

    const sendEnterMessage = async () => {
      if (!isLoggedIn.value || !chatRoomId.value) return

      try {
        const enterMessage = {
          type: 'ENTER',
          roomId: parseInt(chatRoomId.value),
          sender: userName.value,
          message: `${userName.value}님이 채팅방에 입장했습니다.`,
        }

        await sendChatMessage(enterMessage)
      } catch (error) {
        console.error('Error sending enter message:', error)
      }
    }

    const onMessageReceived = (message) => {
      const normalizedMessage = {
        id: message.id,
        sender: message.sender,
        message: message.message,
        type: message.type || 'TALK',
        roomId: message.roomId,
        isMe: message.sender === userName.value,
        timestamp: message.timestamp || new Date().toISOString(),
      }

      // Simply add new message to the end (no sorting needed for real-time messages)
      chatMessages.value.push(normalizedMessage)

      scrollToBottom()
    }

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !isLoggedIn.value || !isConnected.value) return

      try {
        const messageData = {
          type: 'TALK',
          roomId: parseInt(chatRoomId.value),
          sender: userName.value,
          message: newMessage.value.trim(),
        }

        await sendChatMessage(messageData)
        newMessage.value = ''
      } catch (error) {
        console.error('Error sending message:', error)
      }
    }

    const handleScroll = () => {
      if (!chatMessagesContainer.value || isLoadingHistory.value || !hasMoreMessages.value) return

      const { scrollTop } = chatMessagesContainer.value

      // Load previous messages when scrolled to top
      // Only load if cursor is a valid number (not 'latest')
      if (scrollTop === 0 && typeof cursor.value === 'number' && cursor.value > 1) {
        loadChatMessages(cursor.value)
      }
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const scrollToBottom = async () => {
      await nextTick()
      if (chatMessagesContainer.value) {
        // Force scroll to bottom with a small delay to ensure DOM is updated
        setTimeout(() => {
          chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
        }, 50)
      }
    }

    const sendLeaveMessage = async () => {
      if (!isLoggedIn.value || !chatRoomId.value || !isConnected.value) return

      try {
        const leaveMessage = {
          type: 'LEAVE',
          roomId: parseInt(chatRoomId.value),
          sender: userName.value,
          message: `${userName.value}님이 채팅방을 나갔습니다.`,
        }

        await sendChatMessage(leaveMessage)
      } catch (error) {
        console.error('Error sending leave message:', error)
      }
    }

    const disconnectFromChat = async () => {
      if (stompClient.value && isConnected.value) {
        await sendLeaveMessage()
        disconnectChat()
        stompClient.value = null
        isConnected.value = false
      }
    }

    // Lifecycle
    onMounted(() => {
      fetchAttractionDetail()
    })

    onBeforeUnmount(() => {
      disconnectFromChat()
    })

    return {
      // State
      attraction,
      isLoading,
      errorMessage,
      chatMessages,
      newMessage,
      chatMessagesContainer,
      chatRoomId,
      isLoadingHistory,
      cursor,
      hasMoreMessages,
      isConnected,

      // Computed
      attractionId,
      isLoggedIn,
      currentUser,
      userName,

      // Methods
      fetchAttractionDetail,
      connectToChat,
      loadChatMessages,
      sendEnterMessage,
      onMessageReceived,
      sendMessage,
      handleScroll,
      formatTime,
      scrollToBottom,
      sendLeaveMessage,
      disconnectFromChat,
    }
  },
}
</script>

<style scoped>
.attraction-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
}

.error {
  text-align: center;
  padding: 50px;
  color: #e74c3c;
  font-size: 18px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  min-height: 600px;
}

.attraction-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.attraction-card {
  padding: 30px;
}

.attraction-title {
  font-size: 32px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 3px solid #3498db;
  padding-bottom: 10px;
}

.attraction-info p {
  margin-bottom: 15px;
  font-size: 16px;
  line-height: 1.6;
}

.attraction-info a {
  color: #3498db;
  text-decoration: none;
}

.attraction-info a:hover {
  text-decoration: underline;
}

.chat-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
  background: #f8f9fa;
}

.chat-header h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.login-notice {
  margin: 0;
  color: #7f8c8d;
  font-style: italic;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-height: 400px;
  min-height: 300px;
}

.message {
  margin-bottom: 15px;
  display: flex;
}

.message.own-message {
  justify-content: flex-end;
}

.message.system-message {
  justify-content: center;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: #ecf0f1;
}

.own-message .message-content {
  background: #3498db;
  color: white;
}

.system-content {
  background: #f39c12;
  color: white;
  padding: 8px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-style: italic;
}

.system-text {
  text-align: center;
  font-size: 12px;
}

.loading-indicator {
  text-align: center;
  padding: 10px;
  font-style: italic;
  color: #7f8c8d;
}

.no-messages {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
  font-style: italic;
}

.no-messages p {
  margin: 0;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: #ecf0f1;
}

.own-message .message-content {
  background: #3498db;
  color: white;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
}

.username {
  font-weight: bold;
}

.own-message .username {
  color: rgba(255, 255, 255, 0.9);
}

.timestamp {
  opacity: 0.7;
}

.message-text {
  word-wrap: break-word;
  line-height: 1.4;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #ecf0f1;
  background: #f8f9fa;
}

.connection-status {
  text-align: center;
  margin-bottom: 10px;
}

.text-warning {
  color: #f39c12;
  font-style: italic;
}

.input-group {
  display: flex;
  gap: 10px;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 25px;
  outline: none;
  font-size: 14px;
}

.message-input:focus {
  border-color: #3498db;
}

.send-button {
  padding: 12px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.3s;
}

.send-button:hover:not(:disabled) {
  background: #2980b9;
}

.send-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Login prompt styles */
.login-prompt {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 15px;
}

.login-prompt p {
  margin-bottom: 15px;
  color: #666;
}

.login-button {
  display: inline-block;
  padding: 10px 20px;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: background 0.3s;
}

.login-button:hover {
  background: #2980b9;
}

.login-notice {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
  margin: 20px 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .attraction-title {
    font-size: 24px;
  }

  .attraction-card {
    padding: 20px;
  }

  .chat-messages {
    max-height: 300px;
    min-height: 250px;
  }
}
</style>
