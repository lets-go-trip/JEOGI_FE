<template>
  <NavBar />
  <div class="search-view">
    <div class="search-header">
      <div class="container">
        <h1 class="search-title">여행지 검색</h1>
        <div class="search-form">
          <div class="search-form-row">
            <div class="search-form-field region-select">
              <select v-model="selectedRegion" class="form-control">
                <option
                  v-for="option in metropolitanOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="search-form-field keyword-input">
              <input
                v-model="searchTerm"
                type="text"
                class="form-control"
                placeholder="여행지 이름이나 키워드를 입력하세요"
                @keyup.enter="handleSearch"
              />
            </div>

            <div class="search-form-field search-button">
              <button @click="handleSearch" class="btn btn-primary" :disabled="isLoading">
                {{ isLoading ? '검색 중...' : '검색' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="search-content">
      <div class="container">
        <!-- 디버깅 정보 패널 -->
        <div v-if="showDebugInfo" class="debug-panel">
          <h4>디버깅 정보</h4>
          <ul>
            <li>Kakao SDK 로드 상태: {{ kakaoSdkLoaded ? '✓' : '✗' }}</li>
            <li>지도 객체 생성 상태: {{ mapObjectCreated ? '✓' : '✗' }}</li>
            <li>컨테이너 크기: {{ containerDimensions }}</li>
            <li>컨테이너 실제 크기: {{ actualContainerSize }}</li>
            <li>지도 초기화 완료: {{ mapInitialized ? '✓' : '✗' }}</li>
            <li>타일 로딩 완료: {{ tilesLoaded ? '✓' : '✗' }}</li>
          </ul>
          <button @click="debugMapContainer" class="btn btn-outline btn-sm">
            컨테이너 디버그
          </button>
          <button @click="forceMapReload" class="btn btn-outline btn-sm">
            강제 리로드
          </button>
        </div>

        <div class="content-row">
          <div class="map-section">
            <!-- 지도 컨테이너 - 명시적 크기 설정 -->
            <div
              id="kakao-map"
              ref="mapContainer"
              class="map-container"
              :style="mapContainerStyle"
            >
              <!-- 로딩 오버레이 -->
              <div v-if="isMapLoading" class="map-loading-overlay">
                <div class="loading-spinner"></div>
                <p>{{ loadingMessage }}</p>
                <small>{{ debugMessage }}</small>
              </div>

              <!-- 에러 오버레이 -->
              <div v-if="mapLoadingError" class="map-error-overlay">
                <div class="error-content">
                  <h3>지도 로딩 실패</h3>
                  <p>{{ mapLoadingError }}</p>
                  <div class="error-actions">
                    <button @click="retryMapLoad" class="btn btn-primary">
                      다시 시도
                    </button>
                    <button @click="toggleDebugInfo" class="btn btn-outline">
                      디버그 정보 {{ showDebugInfo ? '숨기기' : '보기' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 지도가 로드되었지만 보이지 않을 때 -->
              <div v-if="mapObjectCreated && !tilesLoaded && !isMapLoading" class="map-invisible-overlay">
                <div class="error-content">
                  <h3>지도 표시 문제</h3>
                  <p>지도 객체는 생성되었지만 화면에 표시되지 않고 있습니다.</p>
                  <div class="error-actions">
                    <button @click="forceMapRelayout" class="btn btn-primary">
                      지도 다시 그리기
                    </button>
                    <button @click="toggleDebugInfo" class="btn btn-outline">
                      디버그 정보 보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="results-section">
            <div class="search-results">
              <h2 class="results-title">검색 결과</h2>

              <div v-if="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
                <button @click="clearError" class="error-close">&times;</button>
              </div>

              <div v-if="isLoading" class="loading-indicator">
                <div class="loading-spinner"></div>
                <p>검색 중...</p>
              </div>

              <div v-else-if="searchResults.length === 0" class="no-results">
                <p>검색 결과가 없습니다.</p>
                <small>다른 키워드로 검색해보세요.</small>
              </div>

              <div v-else class="results-list">
                <div
                  v-for="result in searchResults"
                  :key="result.id"
                  class="result-item"
                  @click="$router.push(`/attraction/${result.id}`)"
                >
                  <h3 class="result-title">{{ result.title }}</h3>
                  <p class="result-address">{{ result.addr1 }} {{ result.addr2 }}</p>
                  <div class="result-actions">
                    <router-link :to="`/attraction/${result.id}`" class="btn btn-outline btn-sm"
                      >상세 보기</router-link
                    >
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

<script>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { searchAttractions } from '@/api/attractions'

export default {
  name: 'SearchView',
  components: {
    NavBar,
  },
  setup() {
    const searchTerm = ref('')
    const searchResults = ref([])
    const isLoading = ref(false)
    const errorMessage = ref('')
    const selectedRegion = ref('all')
    const map = ref(null)
    const markers = ref([])
    const mapLoadingError = ref('')
    const isMapLoading = ref(true)
    const loadingMessage = ref('지도를 불러오는 중...')
    const debugMessage = ref('')

    // 디버깅 관련 상태
    const showDebugInfo = ref(false)
    const kakaoSdkLoaded = ref(false)
    const mapObjectCreated = ref(false)
    const mapInitialized = ref(false)
    const tilesLoaded = ref(false)
    const containerDimensions = ref('')
    const actualContainerSize = ref('')
    const mapContainer = ref(null)

    return {
      searchTerm,
      searchResults,
      isLoading,
      errorMessage,
      selectedRegion,
      map,
      markers,
      mapLoadingError,
      isMapLoading,
      loadingMessage,
      debugMessage,
      showDebugInfo,
      kakaoSdkLoaded,
      mapObjectCreated,
      mapInitialized,
      tilesLoaded,
      containerDimensions,
      actualContainerSize,
      mapContainer,
    }
  },
  computed: {
    metropolitanOptions() {
      return [
        { value: 'all', label: '전체' },
        { value: '1', label: '서울특별시' },
        { value: '2', label: '부산광역시' },
        { value: '3', label: '대구광역시' },
        { value: '4', label: '인천광역시' },
        { value: '5', label: '광주광역시' },
        { value: '6', label: '대전광역시' },
        { value: '7', label: '울산광역시' },
        { value: '8', label: '세종특별자치시' },
        { value: '9', label: '경기도' },
        { value: '10', label: '강원도' },
        { value: '11', label: '충청북도' },
        { value: '12', label: '충청남도' },
        { value: '13', label: '전라북도' },
        { value: '14', label: '전라남도' },
        { value: '15', label: '경상북도' },
        { value: '16', label: '경상남도' },
        { value: '17', label: '제주특별자치도' },
      ]
    },
    mapContainerStyle() {
      return {
        width: '100%',
        height: '600px',
        minHeight: '600px',
        minWidth: '300px', // 최소 너비 보장
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        flex: '0 0 auto', // flex 아이템으로서 고정 크기
      }
    },
  },
  data() {
    return {
      resizeHandler: null,
      retryCount: 0,
      maxRetries: 3,
    }
  },
  methods: {
    async handleSearch() {
      this.isLoading = true
      this.errorMessage = ''
      this.clearMarkers()

      const params = {
        query: this.searchTerm,
        metropolitanId: this.selectedRegion !== 'all' ? this.selectedRegion : null,
      }

      try {
        const response = await searchAttractions(params)
        this.searchResults = response.data.attractions || []
        this.updateMap()
      } catch (error) {
        console.error('Search error:', error)
        this.errorMessage = '검색 중 오류가 발생했습니다. 다시 시도해주세요.'
        this.searchResults = []
      } finally {
        this.isLoading = false
      }
    },

    async initializeMap() {
      this.debugMessage = 'SDK 로딩 확인 중...'

      try {
        // 1. Kakao Maps SDK 로드 확인 및 로딩
        if (!window.kakao?.maps) {
          this.debugMessage = 'Kakao Maps SDK 로딩 중...'
          await this.loadKakaoMapsScript()
        }

        this.kakaoSdkLoaded = true
        this.debugMessage = 'SDK 로딩 완료, 컨테이너 확인 중...'

        // 2. DOM이 완전히 렌더링될 때까지 대기
        await nextTick()

        // 3. 지도 컨테이너 확인 및 준비
        await this.waitForContainer()

        // 4. 지도 객체 생성
        await this.createMapObject()

        // 5. 지도 이벤트 설정
        this.setupMapEvents()

        // 6. 강제 리레이아웃
        await this.forceMapRelayout()

      } catch (error) {
        console.error('지도 초기화 실패:', error)
        this.handleMapError(error.message)
      }
    },

    async waitForContainer() {
      const maxWaitTime = 5000 // 5초
      const startTime = Date.now()

      while (Date.now() - startTime < maxWaitTime) {
        const container = document.getElementById('kakao-map')

        if (container) {
          const rect = container.getBoundingClientRect()
          const computedStyle = window.getComputedStyle(container)
          this.containerDimensions = `${rect.width}x${rect.height}`
          this.actualContainerSize = `실제: ${rect.width}px x ${rect.height}px, CSS: ${computedStyle.width} x ${computedStyle.height}`

          if (rect.width > 0 && rect.height > 0) {
            this.debugMessage = `컨테이너 준비 완료 (${this.containerDimensions})`
            return container
          }
        }

        this.debugMessage = `컨테이너 대기 중... (${this.containerDimensions}) - ${this.actualContainerSize}`
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      throw new Error('지도 컨테이너를 찾을 수 없거나 크기가 0입니다.')
    },

    async createMapObject() {
      this.debugMessage = '지도 객체 생성 중...'

      const container = document.getElementById('kakao-map')

      // 컨테이너 스타일 강제 적용
      container.style.width = '100%'
      container.style.height = '600px'
      container.style.position = 'relative'
      container.style.overflow = 'hidden'

      const options = {
        center: new window.kakao.maps.LatLng(36.2, 127.9),
        level: 13,
      }

      // 지도 객체 생성
      this.map = new window.kakao.maps.Map(container, options)
      this.mapObjectCreated = true
      this.debugMessage = '지도 객체 생성 완료'

      console.log('지도 객체 생성됨:', this.map)
    },

    setupMapEvents() {
      if (!this.map) return

      this.debugMessage = '지도 이벤트 설정 중...'

      // 지도 초기화 완료 이벤트
      window.kakao.maps.event.addListener(this.map, 'idle', () => {
        if (!this.mapInitialized) {
          console.log('지도 초기화 완료 (idle 이벤트)')
          this.mapInitialized = true
          this.isMapLoading = false
          this.debugMessage = '지도 초기화 완료'
        }
      })

      // 타일 로딩 완료 이벤트
      window.kakao.maps.event.addListener(this.map, 'tilesloaded', () => {
        console.log('지도 타일 로딩 완료')
        this.tilesLoaded = true
        this.isMapLoading = false
        this.debugMessage = '타일 로딩 완료'
      })

      // 지도 클릭 이벤트 (테스트용)
      window.kakao.maps.event.addListener(this.map, 'click', (mouseEvent) => {
        console.log('지도 클릭됨:', mouseEvent.latLng.toString())
      })

      // 리사이즈 핸들러 설정
      this.setupResizeHandler()
    },

    async forceMapRelayout() {
      if (!this.map) return

      this.debugMessage = '지도 리레이아웃 실행 중...'

      // 여러 번의 리레이아웃 시도
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 200))
        this.map.relayout()
        console.log(`지도 리레이아웃 시도 ${i + 1}`)
      }

      // 지도 중심 재설정
      const center = new window.kakao.maps.LatLng(36.2, 127.9)
      this.map.setCenter(center)

      this.debugMessage = '리레이아웃 완료'
    },

    async loadKakaoMapsScript() {
      return new Promise((resolve, reject) => {
        if (window.kakao?.maps) {
          resolve()
          return
        }

        // 기존 스크립트 제거
        const existingScript = document.querySelector('script[src*="dapi.kakao.com"]')
        if (existingScript) {
          existingScript.remove()
        }

        const script = document.createElement('script')
        const apiKey = import.meta.env.VUE_APP_KAKAO_API_KEY

        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`
        script.async = false // 동기적 로딩으로 변경
        script.defer = false

        script.onload = () => {
          if (window.kakao) {
            window.kakao.maps.load(() => {
              console.log('Kakao Maps SDK 로딩 완료')
              resolve()
            })
          } else {
            reject(new Error('Kakao SDK 초기화 실패'))
          }
        }

        script.onerror = (error) => {
          console.error('Kakao Maps 스크립트 로딩 실패:', error)
          reject(new Error('Kakao Maps 스크립트 로딩 실패'))
        }

        document.head.appendChild(script)
      })
    },

    handleMapError(message) {
      this.mapLoadingError = message
      this.isMapLoading = false
      this.debugMessage = `오류: ${message}`
    },

    async retryMapLoad() {
      if (this.retryCount >= this.maxRetries) {
        this.mapLoadingError = `최대 재시도 횟수(${this.maxRetries})를 초과했습니다.`
        return
      }

      this.retryCount++
      this.mapLoadingError = ''
      this.isMapLoading = true
      this.mapObjectCreated = false
      this.mapInitialized = false
      this.tilesLoaded = false

      console.log(`지도 로딩 재시도 ${this.retryCount}/${this.maxRetries}`)

      await new Promise(resolve => setTimeout(resolve, 1000))
      this.initializeMap()
    },

    async forceMapReload() {
      console.log('강제 지도 리로드 시작')

      // 기존 지도 객체 정리
      if (this.map) {
        this.clearMarkers()
        this.map = null
      }

      // 상태 초기화
      this.mapObjectCreated = false
      this.mapInitialized = false
      this.tilesLoaded = false
      this.isMapLoading = true
      this.mapLoadingError = ''

      // 지도 컨테이너 리셋
      const container = document.getElementById('kakao-map')
      if (container) {
        container.innerHTML = ''
      }

      await this.initializeMap()
    },

    debugMapContainer() {
      const container = document.getElementById('kakao-map')
      if (container) {
        const rect = container.getBoundingClientRect()
        const computedStyle = window.getComputedStyle(container)

        console.log('=== 지도 컨테이너 디버그 정보 ===')
        console.log('컨테이너 요소:', container)
        console.log('크기:', rect)
        console.log('부모 요소:', container.parentElement)
        console.log('부모 크기:', container.parentElement?.getBoundingClientRect())
        console.log('display:', computedStyle.display)
        console.log('visibility:', computedStyle.visibility)
        console.log('position:', computedStyle.position)
        console.log('width:', computedStyle.width)
        console.log('height:', computedStyle.height)
        console.log('flex:', computedStyle.flex)
        console.log('z-index:', computedStyle.zIndex)
        console.log('overflow:', computedStyle.overflow)
        console.log('background:', computedStyle.background)

        this.containerDimensions = `${rect.width}x${rect.height}`
        this.actualContainerSize = `실제: ${rect.width}px x ${rect.height}px, CSS: ${computedStyle.width} x ${computedStyle.height}`

        // 지도 객체 정보
        if (this.map) {
          console.log('지도 객체:', this.map)
          console.log('지도 중심:', this.map.getCenter().toString())
          console.log('지도 레벨:', this.map.getLevel())
        }
      }
    },

    toggleDebugInfo() {
      this.showDebugInfo = !this.showDebugInfo
      if (this.showDebugInfo) {
        this.debugMapContainer()
      }
    },

    setupResizeHandler() {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler)
      }

      this.resizeHandler = () => {
        if (this.map) {
          setTimeout(() => {
            this.map.relayout()
            console.log('윈도우 리사이즈로 인한 지도 리레이아웃')
          }, 100)
        }
      }

      window.addEventListener('resize', this.resizeHandler)
    },

    clearMarkers() {
      this.markers.forEach((marker) => marker.setMap(null))
      this.markers = []
    },

    updateMap() {
      if (!this.map || this.searchResults.length === 0) return

      this.clearMarkers()

      const bounds = new window.kakao.maps.LatLngBounds()

      this.searchResults.forEach((attraction) => {
        if (attraction.mapx && attraction.mapy) {
          const position = new window.kakao.maps.LatLng(
            parseFloat(attraction.mapy),
            parseFloat(attraction.mapx),
          )

          const marker = new window.kakao.maps.Marker({
            map: this.map,
            position: position,
            title: attraction.title,
          })

          this.markers.push(marker)
          bounds.extend(position)

          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:5px;width:150px;text-align:center;">${attraction.title}</div>`,
          })

          window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            infowindow.open(this.map, marker)
          })

          window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            infowindow.close()
          })

          window.kakao.maps.event.addListener(marker, 'click', () => {
            this.$router.push(`/attraction/${attraction.id}`)
          })
        }
      })

      if (!bounds.isEmpty()) {
        this.map.setBounds(bounds)
      }
    },

    clearError() {
      this.errorMessage = ''
    },

    cleanupResources() {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler)
        this.resizeHandler = null
      }

      this.clearMarkers()
      this.map = null
    },
  },

  async mounted() {
    console.log('SearchView 컴포넌트 마운트됨')

    // 다음 틱에서 지도 초기화 시작
    await nextTick()

    try {
      await this.initializeMap()
    } catch (error) {
      console.error('초기 지도 로딩 실패:', error)
      // 2초 후 자동 재시도
      setTimeout(() => this.retryMapLoad(), 2000)
    }
  },

  beforeUnmount() {
    this.cleanupResources()
  },
}
</script>

<style scoped>
.search-view {
  min-height: 100vh;
  background-color: var(--background-color);
}

.search-header {
  background-color: var(--primary-color);
  padding: 3rem 0;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.search-title {
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 700;
  font-size: 2.8rem;
  letter-spacing: -0.5px;
}

.search-form {
  max-width: 900px;
  margin: 0 auto;
}

.search-form-row {
  display: flex;
  margin: 0 -0.5rem;
  align-items: center;
}

.search-form-field {
  padding: 0 0.5rem;
}

.region-select {
  width: 25%;
}

.region-select select {
  height: 48px;
  font-size: 1.05rem;
  border-radius: 6px;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.keyword-input {
  width: 60%;
}

.keyword-input input {
  height: 48px;
  font-size: 1.05rem;
  border-radius: 6px;
  padding: 0 15px;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.search-button {
  width: 15%;
}

.search-button button {
  height: 48px;
  width: 100%;
  font-size: 1.05rem;
  font-weight: 500;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.search-content {
  padding: 2rem 0;
}

/* 디버그 패널 */
.debug-panel {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.debug-panel h4 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.debug-panel ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.debug-panel li {
  padding: 0.2rem 0;
  font-family: monospace;
  font-size: 0.9rem;
}

/* 커스텀 그리드 레이아웃 */
.content-row {
  display: flex;
  gap: 2rem;
  width: 100%;
  min-height: 600px;
}

.map-section {
  flex: 2; /* 2/3 너비 차지 */
  min-width: 0; /* flex 아이템의 최소 너비 제한 해제 */
}

.results-section {
  flex: 1; /* 1/3 너비 차지 */
  min-width: 300px; /* 최소 너비 보장 */
}

/* 지도 컨테이너 - 강제 스타일링 */
.map-container {
  width: 100% !important;
  height: 600px !important;
  min-height: 600px !important;
  min-width: 300px !important; /* 최소 너비 보장 */
  border-radius: 12px;
  overflow: hidden !important;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  margin-bottom: 1.5rem;
  border: 1px solid #eaeaea;
  background-color: #f7f7f7;
  position: relative !important;
  display: block !important;
}

/* 오버레이 스타일 */
.map-loading-overlay,
.map-error-overlay,
.map-invisible-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(248, 249, 250, 0.95);
  z-index: 1000;
  border-radius: 12px;
}

.error-content {
  text-align: center;
  padding: 2rem;
  max-width: 400px;
}

.error-content h3 {
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-actions {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.search-results {
  background-color: white;
  border-radius: 12px;
  padding: 1.8rem;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  height: 600px;
  overflow-y: auto;
  border: 1px solid #eaeaea;
}

.results-title {
  font-size: 1.7rem;
  margin-bottom: 1.8rem;
  color: var(--primary-color);
  font-weight: 600;
  border-bottom: 2px solid var(--primary-light);
  padding-bottom: 0.8rem;
}

.alert {
  position: relative;
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

.error-close {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
}

.result-item {
  padding: 1.2rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 0.8rem;
}

.result-item:hover {
  background-color: rgba(78, 205, 196, 0.1);
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.result-title {
  font-size: 1.2rem;
  color: var(--primary-dark);
  margin-bottom: 0.7rem;
  font-weight: 600;
}

.result-address {
  color: var(--text-light);
  font-size: 0.95rem;
  margin-bottom: 0.7rem;
  line-height: 1.4;
}

.result-actions {
  margin-top: 0.8rem;
}

.result-actions .btn {
  transition: all 0.2s ease;
  padding: 0.35rem 0.8rem;
}

.result-actions .btn:hover {
  transform: translateY(-2px);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.no-results,
.loading-indicator {
  text-align: center;
  padding: 2rem 0;
  color: var(--text-light);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Kakao Maps 강제 스타일 오버라이드 */
#kakao-map * {
  box-sizing: border-box !important;
}

/* 지도 내부 요소들이 제대로 표시되도록 */
#kakao-map .MapWrap,
#kakao-map .map_container,
#kakao-map canvas {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
  display: block !important;
}

/* 반응형 스타일 */
@media (max-width: 1024px) {
  .content-row {
    flex-direction: column;
    gap: 1rem;
  }

  .map-section,
  .results-section {
    flex: none;
    width: 100%;
  }

  .map-container {
    height: 500px !important;
    min-height: 500px !important;
  }

  .search-results {
    height: auto;
    max-height: 500px;
  }
}

@media (max-width: 767px) {
  .search-header {
    padding: 2rem 0;
  }

  .search-title {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  .search-form-row {
    flex-direction: column;
  }

  .search-form-field {
    width: 100% !important;
    margin-bottom: 0.8rem;
  }

  .content-row {
    gap: 0.5rem;
  }

  .map-container {
    height: 400px !important;
    min-height: 400px !important;
    border-radius: 8px;
  }

  .search-results {
    height: auto;
    max-height: 450px;
    border-radius: 8px;
    padding: 1.5rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .debug-panel {
    font-size: 0.8rem;
  }
}
</style>
