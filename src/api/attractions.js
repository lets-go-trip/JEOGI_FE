import apiClient from './index'

export function searchAttractions(searchParams) {
  return apiClient.get('/api/search/condition', { params: searchParams })
}

export function getAttractionDetail(attractionId) {
  return apiClient.get(`/api/search/attractions/${attractionId}`)
}

export function getLocals(metropolitanCode) {
  return apiClient.get(`/api/search/local?metropolitanCode=${metropolitanCode}`)
}

export function getContentsType() {
  return apiClient.get(`/api/search/contents-type`)
}
