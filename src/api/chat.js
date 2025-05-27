import apiClient from './index'
import SockJS from 'sockjs-client'
import { Stomp } from '@stomp/stompjs'

let stompClient = null

export function connectChatRoom(roomId, onMessageReceived) {
  // Use SockJS like the working example
  const sockJS = new SockJS(`http://70.12.107.134:8080/ws`)
  stompClient = Stomp.over(sockJS)

  // Set heartbeat
  stompClient.heartbeat.outgoing = 20000
  stompClient.heartbeat.incoming = 20000

  stompClient.connect(
    {},
    (frame) => {
      console.log('Connected: ' + frame)
      // Subscribe to the chat room - using /sub prefix as per backend config
      stompClient.subscribe(`/sub/chat/room/${roomId}`, (message) => {
        const received = JSON.parse(message.body)
        onMessageReceived(received)
      })
    },
    (error) => {
      console.error('Connection error:', error)
    },
  )

  return stompClient
}

export function disconnectChat() {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect()
    stompClient = null
  }
}

export function sendChatMessage(message) {
  if (stompClient && stompClient.connected) {
    // Send message using /pub prefix as per backend config
    stompClient.send('/pub/chat/message', {}, JSON.stringify(message))
  } else {
    console.error('STOMP client not connected')
  }
}

export function getChatMessages(roomId, cursor = 'latest') {
  console.log(`메시지 가져오기 사용 ${cursor}`)
  return apiClient.get(`/api/chat/${roomId}/${cursor}`)
}
