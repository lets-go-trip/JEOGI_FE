import apiClient from './index'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

let stompClient = null

export function connectChatRoom(roomId, onMessageReceived) {
  const socket = new SockJS('/ws')
  stompClient = new Client({
    webSocketFactory: () => socket,
    debug: function (str) {
      console.log(str)
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  })

  stompClient.onConnect = (frame) => {
    console.log('Connected: ' + frame)
    stompClient.subscribe(`/topic/chat/room/${roomId}`, (message) => {
      const received = JSON.parse(message.body)
      onMessageReceived(received)
    })
  }

  stompClient.onStompError = (frame) => {
    console.error('Broker reported error: ' + frame.headers['message'])
    console.error('Additional details: ' + frame.body)
  }

  stompClient.activate()
  return stompClient
}

export function disconnectChat() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
}

export function sendChatMessage(message) {
  if (stompClient && stompClient.connected) {
    stompClient.publish({
      destination: '/app/chat/message',
      body: JSON.stringify(message),
    })
  } else {
    console.error('STOMP client not connected')
  }
}

export function getChatMessages(roomId, cursor = 'latest') {
  return apiClient.get(`/api/chat/${roomId}/${cursor}`)
}
