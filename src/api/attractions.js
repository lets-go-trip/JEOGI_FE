import apiClient from './index'

export function searchAttractions(searchParams) {
  return apiClient.get('/api/search/attractions', { params: searchParams })
}

export function getAttractionDetail(attractionId) {
  return apiClient.get(`/api/search/attractions/${attractionId}`)
}
