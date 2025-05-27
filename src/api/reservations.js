import apiClient from './index'

export function getAvailableParkingSpaces(parkingLotId, reservationRequest) {
  return apiClient.get(`/api/v1/parking-reservations/${parkingLotId}`, {
    params: reservationRequest,
  })
}

export function createParkingReservation(parkingLotId, reservationRequest) {
  return apiClient.post(`/api/v1/parking-lots/${parkingLotId}/reservation`, reservationRequest)
}

export function getMyReservations() {
  return apiClient.get('/api/v1/parking-reservations/me')
}

export function cancelReservation(reservationId) {
  return apiClient.delete(`/api/v1/parking-reservations/${reservationId}`)
}
