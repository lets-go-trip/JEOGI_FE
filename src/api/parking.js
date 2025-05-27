import api from './index'

// 예약 가능한 주차 공간 조회
export const getAvailableParkingSpaces = async (parkingLotId, startDateTime, endDateTime) => {
  try {
    const params = {
      startDateTime: startDateTime, // 이미 yyyy-MM-ddTHH:mm:ss 형식의 문자열
      endDateTime: endDateTime,
    }

    const response = await api.get(`/api/v1/parking-reservations/${parkingLotId}`, { params })
    return response
  } catch (error) {
    console.error('Error fetching available parking spaces:', error)
    throw error
  }
}

// 주차 예약하기
export const createParkingReservation = async (parkingLotId, startDateTime, endDateTime) => {
  try {
    const requestData = {
      startDateTime: startDateTime, // 이미 yyyy-MM-ddTHH:mm:ss 형식의 문자열
      endDateTime: endDateTime,
    }

    const response = await api.post(`/api/v1/parking-lots/${parkingLotId}/reservation`, requestData)
    return response
  } catch (error) {
    console.error('Error creating parking reservation:', error)
    throw error
  }
}
