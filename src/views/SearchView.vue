<script>
import { ref } from 'vue'
import NavBar from '@/components/common/NavBar.vue'
import { searchAttractions, getLocals, getContentsType } from '@/api/attractions'

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
    const selectedLocal = ref('all')
    const selectedContentType = ref('all')
    const localOptions = ref([])
    const contentTypeOptions = ref([])
    const isLoadingLocals = ref(false)
    const isLoadingContentTypes = ref(false)
    const map = ref(null)
    const markers = ref([])
    const searchRange = ref(100) // 검색 범위 (km 단위)
    const sliderValue = ref(50) // 슬라이더의 선형 값 (1-100)
    const isRangeSearchEnabled = ref(false) // 검색 범위 활성화 여부
    const rangeCircle = ref(null) // 검색 범위를 나타내는 원
    const circleHideTimer = ref(null) // 원을 숨기기 위한 타이머
    const isAdvancedSearchVisible = ref(false) // 세부 검색 조건 표시 여부

    return {
      searchTerm,
      searchResults,
      isLoading,
      errorMessage,
      selectedRegion,
      selectedLocal,
      selectedContentType,
      localOptions,
      contentTypeOptions,
      isLoadingLocals,
      isLoadingContentTypes,
      map,
      markers,
      searchRange,
      sliderValue,
      isRangeSearchEnabled,
      rangeCircle,
      circleHideTimer,
      isAdvancedSearchVisible,
    }
  },
  computed: {
    metropolitanOptions() {
      return [
        { value: 'all', label: '전체' },
        { value: '1', label: '서울특별시' },
        { value: '2', label: '인천광역시' },
        { value: '3', label: '대전광역시' },
        { value: '4', label: '대구광역시' },
        { value: '5', label: '광주광역시' },
        { value: '6', label: '부산광역시' },
        { value: '7', label: '울산광역시' },
        { value: '8', label: '세종특별자치시' },
        { value: '31', label: '경기도' },
        { value: '32', label: '강원도' },
        { value: '33', label: '충청북도' },
        { value: '34', label: '충청남도' },
        { value: '35', label: '경상북도' },
        { value: '36', label: '경상남도' },
        { value: '37', label: '전라북도' },
        { value: '38', label: '전라남도' },
        { value: '39', label: '제주특별자치도' },
      ]
    },
  },
  data() {
    return {
      resizeHandler: null,
      mapInitialized: false,
    }
  },
  methods: {
    // 슬라이더 값을 로그 스케일로 변환 (1-100 → 1.0-100.0km)
    convertToLogScale(sliderValue) {
      // 슬라이더 값 1-100을 0-1 범위로 정규화
      const normalized = (sliderValue - 1) / 99
      
      // 로그 스케일 변환: 1km ~ 100km
      // log(1) = 0, log(100) = 2이므로 2를 곱함
      const logValue = Math.pow(10, normalized * 2)
      
      // 소수점 첫째 자리까지 반올림하여 반환
      return Math.round(logValue * 10) / 10
    },

    // 로그 스케일 값을 슬라이더 값으로 역변환
    convertFromLogScale(logValue) {
      // 1.0-100.0km 범위를 0-2 로그 범위로 변환
      const logNormalized = Math.log10(logValue) / 2
      
      // 0-1 범위를 1-100 슬라이더 범위로 변환
      const sliderValue = logNormalized * 99 + 1
      
      return Math.round(sliderValue)
    },

    // 슬라이더 값이 변경될 때 실제 거리 업데이트
    updateSearchRangeFromSlider() {
      this.searchRange = this.convertToLogScale(this.sliderValue)
    },
    async handleSearch() {
      this.isLoading = true
      this.errorMessage = ''
      this.clearMarkers()

      

      const params = {
        query: this.searchTerm,
        metropolitanCode: this.selectedRegion !== 'all' ? this.selectedRegion : null,
        localCode: this.selectedLocal !== 'all' ? this.selectedLocal : null,
        contentTypeId: this.selectedContentType !== 'all' ? this.selectedContentType : null,
        isRangeSearch: this.isRangeSearchEnabled, // 체크박스 상태에 따라 결정
        latitude: this.map.getCenter().getLat(),
        longitude: this.map.getCenter().getLng(),
        range: this.searchRange, // 슬라이더에서 설정된 범위 값 사용
      }

      // 검색 버튼을 눌렀을 때 검색 범위 설정을 false로 만드는 기능
      this.isRangeSearchEnabled = false

      try {
        const response = await searchAttractions(params)
        this.searchResults = response.data.attractions || []
        this.fetchTime = response.data.fetchTime || '0'
        console.log('locals: ', this.localOptions)
        this.updateMap()
      } catch (error) {
        console.error('Search error:', error)
        this.errorMessage = '검색 중 오류가 발생했습니다. 다시 시도해주세요.'
        this.searchResults = []
      } finally {
        this.isLoading = false
      }
    },

    // 지역 선택 변경 처리
    async onRegionChange() {
      console.log('지역 변경됨:', this.selectedRegion)

      // 로컬 선택 초기화
      this.selectedLocal = 'all'
      this.localOptions = []

      // '전체' 선택 시 로컬 옵션 비우기
      if (this.selectedRegion === 'all') {
        return
      }

      // 선택된 지역의 로컬 옵션 로드
      await this.loadLocalOptions(this.selectedRegion)
    },

    // 로컬 옵션 로드
    async loadLocalOptions(metropolitanCode) {
      this.isLoadingLocals = true

      try {
        const response = await getLocals(metropolitanCode)

        if (response.status != 200) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = response.data

        // API 응답 구조에 따라 locals 배열 매핑
        if (data.locals && Array.isArray(data.locals)) {
          this.localOptions = data.locals.map((local) => ({
            value: local.id,
            label: local.name,
          }))
        } else {
          console.warn('예상하지 못한 API 응답 구조:', data)
          this.localOptions = []
        }
      } catch (error) {
        console.error('로컬 옵션 로딩 실패:', error)
        this.localOptions = []
        this.errorMessage = '지역 정보를 불러오는 중 오류가 발생했습니다.'
      } finally {
        this.isLoadingLocals = false
      }
    },

    // 여행지 유형 옵션 로드
    async loadContentTypeOptions() {
      this.isLoadingContentTypes = true

      try {
        const response = await getContentsType()

        if (response.status != 200) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = response.data

        // API 응답 구조에 따라 조정 (응답 구조를 모르므로 여러 케이스 대응)
        let contentTypes = []

        if (data.contentTypes && Array.isArray(data.contentTypes)) {
          contentTypes = data.contentTypes
        } else if (data.contents && Array.isArray(data.contents)) {
          contentTypes = data.contents
        } else if (data.types && Array.isArray(data.types)) {
          contentTypes = data.types
        } else if (Array.isArray(data)) {
          contentTypes = data
        } else {
          console.warn('예상하지 못한 여행지 유형 API 응답 구조:', data)
          contentTypes = []
        }

        this.contentTypeOptions = contentTypes.map((type) => ({
          value: type.id,
          label: type.name || type.typeName || type.title,
        }))
      } catch (error) {
        console.error('여행지 유형 옵션 로딩 실패:', error)
        this.contentTypeOptions = []

        // // 개발 환경에서 mock 데이터 사용
        // if (import.meta.env?.DEV) {
        //   this.contentTypeOptions = this.getMockContentTypeOptions()
        //   console.log('Mock 여행지 유형 데이터 사용:', this.contentTypeOptions)
        // }
      } finally {
        console.log(this.contentTypeOptions)
        this.isLoadingContentTypes = false
      }
    },

    // 개발용 Mock 여행지 유형 데이터
    getMockContentTypeOptions() {
      return [
        { value: '12', label: '관광지' },
        { value: '14', label: '문화시설' },
        { value: '15', label: '축제공연행사' },
        { value: '25', label: '여행코스' },
        { value: '28', label: '레포츠' },
        { value: '32', label: '숙박' },
        { value: '38', label: '쇼핑' },
        { value: '39', label: '음식점' },
      ]
    },

    initializeMap() {
      try {
        if (window.kakao && window.kakao.maps) {
          console.log('Initializing Kakao map...')
          const container = document.getElementById('kakao-map')

          if (!container) {
            console.error('Map container element not found')
            this.errorMessage = '지도 컨테이너를 찾을 수 없습니다.'
            return
          }

          const options = {
            center: new window.kakao.maps.LatLng(36.2, 127.9),
            level: 13,
          }

          this.map = new window.kakao.maps.Map(container, options)
          this.map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.TERRAIN)
          this.setupResizeHandler()

          setTimeout(() => {
            if (this.map) {
              this.map.relayout()
              console.log('Forced map relayout')
            }
          }, 500)

          console.log('Map initialized successfully')
          this.mapInitialized = true
          
          // 지도 초기화 후 검색 범위 원 표시 및 타이머 설정
          if (this.isRangeSearchEnabled) {
            this.updateRangeCircle()
            this.scheduleCircleHide()
          }
        } else {
          console.error('Kakao maps not loaded')
          this.displayMapError('지도를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.')
        }
      } catch (error) {
        console.error('Error initializing map:', error)
        this.displayMapError('지도를 불러오는데 오류가 발생했습니다: ' + error.message)
      }
    },

    setupResizeHandler() {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler)
      }

      this.resizeHandler = () => {
        if (this.map) {
          console.log('Window resized, forcing map relayout')
          this.map.relayout()
        }
      }

      window.addEventListener('resize', this.resizeHandler)
    },

    displayMapError(message) {
      this.errorMessage = message
      const container = document.getElementById('kakao-map')
      if (container) {
        container.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; padding: 2rem; text-align: center;">
            <h3 style="color: #dc3545; margin-bottom: 1rem;">지도 로딩 실패</h3>
            <p>${message}</p>
            <p>새로고침을 하거나 잠시 후 다시 시도해주세요.</p>
            <button
              style="margin-top: 1rem; padding: 0.5rem 1rem; background-color: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;"
              onclick="location.reload()"
            >새로고침</button>
          </div>
        `
      }
    },

    clearMarkers() {
      this.markers.forEach((marker) => marker.setMap(null))
      this.markers = []
    },

    // 검색 범위 원 업데이트
    updateRangeCircle() {
      if (!this.map) return

      // 기존 원 제거
      if (this.rangeCircle) {
        this.rangeCircle.setMap(null)
        this.rangeCircle = null
      }

      // 검색 범위가 활성화된 경우에만 원 표시
      if (this.isRangeSearchEnabled) {
        const center = this.map.getCenter()
        
        this.rangeCircle = new window.kakao.maps.Circle({
          center: center, // 지도의 중심 좌표
          radius: this.searchRange * 1000, // km를 미터로 변환
          strokeWeight: 2, // 선의 두께
          strokeColor: '#4ECDCC', // 선의 색깔 (primary 색상)
          strokeOpacity: 0.8, // 선의 불투명도
          strokeStyle: 'solid', // 선의 스타일
          fillColor: '#4ECDCC', // 채우기 색깔
          fillOpacity: 0.1 // 채우기 불투명도
        })

        // 지도에 원을 표시
        this.rangeCircle.setMap(this.map)
      }
    },

    // 원을 숨기는 메서드
    hideRangeCircle() {
      if (this.rangeCircle) {
        this.rangeCircle.setMap(null)
        this.rangeCircle = null
      }
    },

    // 타이머를 클리어하는 메서드
    clearCircleHideTimer() {
      if (this.circleHideTimer) {
        clearTimeout(this.circleHideTimer)
        this.circleHideTimer = null
      }
    },

    // 타이머를 설정하여 일정 시간 후 원을 숨기는 메서드
    scheduleCircleHide() {
      // 기존 타이머가 있으면 클리어
      this.clearCircleHideTimer()
      
      // 검색 범위가 활성화된 경우에만 타이머 설정
      if (this.isRangeSearchEnabled) {
        this.circleHideTimer = setTimeout(() => {
          this.hideRangeCircle()
          this.circleHideTimer = null
        }, 1000) // 3초 후 원을 숨김
      }
    },

    // 검색 범위 변경 핸들러
    onRangeChange() {
      // 슬라이더 값을 로그 스케일로 변환하여 실제 거리 업데이트
      this.updateSearchRangeFromSlider()
      
      // 원을 업데이트하고 타이머를 재설정
      this.updateRangeCircle()
      this.scheduleCircleHide()
    },

    // 검색 범위 활성화 상태 변경 핸들러
    onRangeSearchToggle() {
      // 타이머 클리어
      this.clearCircleHideTimer()
      
      if (this.isRangeSearchEnabled) {
        // 체크박스가 활성화되면 원을 표시하고 타이머 설정
        this.updateRangeCircle()
        this.scheduleCircleHide()
      } else {
        // 체크박스가 비활성화되면 원을 즉시 숨김
        this.hideRangeCircle()
      }
    },

    // 세부 검색 조건 토글
    toggleAdvancedSearch() {
      this.isAdvancedSearchVisible = !this.isAdvancedSearchVisible
    },

    updateMap() {
      if (!this.map || this.searchResults.length === 0) return

      this.clearMarkers()

      const bounds = new window.kakao.maps.LatLngBounds()

      this.searchResults.forEach((attraction) => {
        if (attraction.latitude && attraction.longitude) {
          const position = new window.kakao.maps.LatLng(
            parseFloat(attraction.latitude),
            parseFloat(attraction.longitude),
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
        setTimeout(() => {
          if (this.map) {
            this.map.relayout()
          }
        }, 100)
      }
    },

    loadKakaoMapsScript() {
      return new Promise((resolve, reject) => {
        if (window.kakao && window.kakao.maps) {
          console.log('Kakao Maps already loaded, using existing instance')
          resolve()
          return
        }

        const script = document.createElement('script')

        // 환경변수에서 API 키 가져오기
        let apiKey = ''
        try {
          // Vite 환경
          apiKey = import.meta.env?.VITE_KAKAO_API_KEY
        } catch (e) {
          try {
            // Vue CLI 환경 (fallback)
            apiKey = process.env?.VUE_APP_KAKAO_API_KEY
          } catch (e2) {
            console.warn('환경변수를 읽을 수 없습니다. 기본 API 키를 사용합니다.')
          }
        }

        if (!apiKey) {
          apiKey = '7f5ff2c0c4a6e2ec642a8dc8b2fe4dc5'
          console.warn('환경변수에서 KAKAO API 키를 찾을 수 없어 기본 키를 사용합니다.')
        }

        const timestamp = new Date().getTime()
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false&t=${timestamp}`
        console.log('Loading Kakao Maps with URL:', script.src)

        script.onload = () => {
          if (window.kakao) {
            console.log('Kakao SDK loaded successfully')
            window.kakao.maps.load(() => {
              console.log('Kakao maps loaded successfully')
              resolve()
            })
          } else {
            console.error('Kakao SDK failed to initialize')
            reject(new Error('Kakao SDK not initialized'))
          }
        }

        script.onerror = (error) => {
          console.error('Error loading Kakao Maps script:', error)
          reject(new Error('Kakao Maps 스크립트 로딩 실패'))
        }

        document.head.appendChild(script)
      })
    },

    cleanupResources() {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler)
        this.resizeHandler = null
      }

      this.clearMarkers()
      
      // 타이머 클리어
      this.clearCircleHideTimer()
      
      // 검색 범위 원 제거
      if (this.rangeCircle) {
        this.rangeCircle.setMap(null)
        this.rangeCircle = null
      }
      
      this.map = null
    },
  },

  async mounted() {
    console.log('SearchView 컴포넌트 마운트됨')

    // 초기 슬라이더 값을 현재 검색 범위에 맞게 설정
    this.sliderValue = this.convertFromLogScale(this.searchRange)

    // 여행지 유형 옵션 로드 (독립적으로 실행)
    this.loadContentTypeOptions()

    try {
      await this.loadKakaoMapsScript()
      this.initializeMap()

      if (!this.map) {
        console.log('Retrying map initialization after delay...')
        setTimeout(async () => {
          try {
            await this.loadKakaoMapsScript()
            this.initializeMap()
          } catch (error) {
            console.error('Map retry failed:', error)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to load Kakao Maps:', error)
      this.errorMessage = '지도를 불러오는 중 오류가 발생했습니다.'
    }
  },

  beforeUnmount() {
    this.cleanupResources()
  },
}
</script>

<template>
  <NavBar />
  <div class="search-view">
    <div class="search-header">
      <div class="container">
        <h1 class="search-title">여행지 검색</h1>
        <div class="search-form">
          <!-- 기본 검색 바 -->
          <div class="basic-search-row">
            <div class="keyword-input-field">
              <input
                v-model="searchTerm"
                type="text"
                class="form-control keyword-input"
                placeholder="여행지 이름이나 키워드를 입력하세요"
                @keyup.enter="handleSearch"
              />
            </div>
            <div class="search-actions">
              <button @click="handleSearch" class="btn btn-primary search-btn" :disabled="isLoading">
                {{ isLoading ? '검색 중...' : '검색' }}
              </button>
              <button @click="toggleAdvancedSearch" class="btn btn-secondary advanced-toggle-btn">
                <span class="advanced-text">세부조건</span>
                <span class="toggle-icon">{{ isAdvancedSearchVisible ? '▲' : '▼' }}</span>
              </button>
            </div>
          </div>

          <!-- 세부 검색 조건 패널 -->
          <div v-show="isAdvancedSearchVisible" class="advanced-search-panel">
            <div class="panel-header">
              <h3 class="panel-title">세부 검색 조건</h3>
            </div>
            
            <div class="advanced-options">
              <!-- 지역 및 유형 선택 -->
              <div class="options-row">
                <div class="option-group">
                  <label class="option-label">지역</label>
                  <div class="region-selects">
                    <select v-model="selectedRegion" @change="onRegionChange" class="form-control region-select">
                      <option
                        v-for="option in metropolitanOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                    
                    <select
                      v-model="selectedLocal"
                      class="form-control local-select"
                      :disabled="selectedRegion === 'all' || isLoadingLocals"
                    >
                      <option value="all">
                        {{ isLoadingLocals ? '로딩 중...' : '전체 지역' }}
                      </option>
                      <option v-for="local in localOptions" :key="local.value" :value="local.value">
                        {{ local.label }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="option-group">
                  <label class="option-label">유형</label>
                  <select
                    v-model="selectedContentType"
                    class="form-control content-type-select"
                    :disabled="isLoadingContentTypes"
                  >
                    <option value="all">
                      {{ isLoadingContentTypes ? '로딩 중...' : '전체 유형' }}
                    </option>
                    <option
                      v-for="contentType in contentTypeOptions"
                      :key="contentType.value"
                      :value="contentType.value"
                    >
                      {{ contentType.label }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- 검색 범위 설정 -->
              <div class="range-section">
                <div class="range-checkbox-wrapper">
                  <label class="checkbox-label">
                    <input
                      v-model="isRangeSearchEnabled"
                      type="checkbox"
                      class="range-checkbox"
                      @change="onRangeSearchToggle"
                    />
                    <span class="checkbox-text">검색 범위 설정 사용</span>
                  </label>
                </div>
                
                <div v-if="isRangeSearchEnabled" class="range-slider-field">
                  <label class="range-label">검색 범위: {{ searchRange.toFixed(1) }}km</label>
                  <div class="range-slider-wrapper">
                    <input
                      v-model.number="sliderValue"
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      class="range-slider"
                      @input="onRangeChange"
                    />
                    <div class="range-marks">
                      <span class="range-mark">1km</span>
                      <span class="range-mark">10km</span>
                      <span class="range-mark">100km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="search-content">
      <div class="container">
        <div class="content-row">
          <div class="map-section">
            <div id="kakao-map" class="map-container"></div>
          </div>

          <div class="results-section">
            <div class="search-results">
              <h2 class="results-title">검색 결과</h2>
              <div v-if="searchResults.length != 0" class="results-info">
                <div class="results-count">
                  {{ searchResults.length }}개, {{ fetchTime }}초 걸림
                </div>
                <div v-if="searchResults.length === 500" class="results-limit-notice">
                  검색 결과가 많아 일부만 표시됩니다.
                </div>
              </div>

              <div v-if="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>

              <div v-if="isLoading" class="loading-indicator">
                <div class="loading-spinner"></div>
                <p>검색 중...</p>
              </div>

              <div v-else-if="searchResults.length === 0" class="no-results">
                <p>검색 결과가 없습니다.</p>
                <small>Tip: 다른 키워드, 조건으로 검색해보세요.</small>
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
                      >상세 보기</router-link>
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
  max-width: 1200px;
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
  width: 15%;
}

.local-select {
  width: 15%;
}

.content-type-select {
  width: 90%;
}

.region-select select,
.local-select select,
.content-type-select select {
  height: 48px;
  font-size: 1.05rem;
  border-radius: 6px;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.local-select select:disabled,
.content-type-select select:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.keyword-input {
  width: 43%;
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
  width: 12%;
}

.search-button button {
  height: 48px;
  width: 100%;
  font-size: 1.05rem;
  font-weight: 500;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* 기본 검색 바 스타일 */
.basic-search-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0;
}

.keyword-input-field {
  flex: 1;
}

.keyword-input {
  height: 48px;
  font-size: 1.05rem;
  border-radius: 6px;
  padding: 0 15px;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.search-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search-btn {
  height: 48px;
  padding: 0 1.5rem;
  font-size: 1.05rem;
  font-weight: 500;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  white-space: nowrap;
}

.advanced-toggle-btn {
  height: 48px;
  padding: 0 1rem;
  font-size: 0.95rem;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.advanced-toggle-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.advanced-text {
  font-weight: 500;
}

.toggle-icon {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

/* 세부 검색 패널 스타일 */
.advanced-search-panel {
  margin-top: 1.5rem;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
  }
}

.panel-header {
  margin-bottom: 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.8rem;
}

.panel-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin: 0;
}

.advanced-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 옵션 행 스타일 */
.options-row {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-group:first-child {
  flex: 2; /* 지역 선택 그룹 */
}

.option-group:last-child {
  flex: 2; /* 여행지 유형 그룹 - 지역 선택과 동일한 크기 */
}

.option-label {
  font-size: 1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.region-selects {
  display: flex;
  gap: 0.5rem;
}

.region-select,
.local-select,
.content-type-select {
  height: 40px;
  font-size: 0.95rem;
  border-radius: 6px;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background-color: white;
  flex: 1;
}

.local-select:disabled,
.content-type-select:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

/* 검색 범위 섹션 스타일 */
.range-section {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 1.5rem;
}

/* 체크박스 스타일 */
.range-checkbox-wrapper {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
  font-size: 1rem;
  font-weight: 500;
}

.range-checkbox {
  margin-right: 0.8rem;
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: white;
}

.checkbox-text {
  user-select: none;
}

/* 범위 슬라이더 스타일 */
.range-slider-field {
  background-color: rgba(255, 255, 255, 0.05);
  padding: 1rem;
  border-radius: 6px;
}

.range-label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: white;
  text-align: center;
}

.range-slider-wrapper {
  position: relative;
}

.range-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.range-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
}

.range-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.range-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
}

.range-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 0.5rem;
}

.range-mark {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.search-content {
  padding: 2rem 0;
}

/* 커스텀 그리드 레이아웃 */
.content-row {
  display: flex;
  gap: 2rem;
  width: 100%;
  min-height: 600px;
}

.map-section {
  flex: 2;
  min-width: 0;
}

.results-section {
  flex: 1;
  min-width: 300px;
}

.map-container {
  width: 100% !important;
  height: 600px !important;
  min-height: 600px !important;
  min-width: 300px !important;
  border-radius: 12px;
  overflow: hidden !important;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  margin-bottom: 1.5rem;
  border: 1px solid #eaeaea;
  background-color: #f7f7f7;
  position: relative !important;
  display: block !important;
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

/* 검색 결과 정보 스타일 */
.results-info {
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #f8fffe 0%, #e8f9f8 100%);
  border-radius: 12px;
  border: 1px solid rgba(78, 205, 196, 0.2);
  box-shadow: 0 2px 8px rgba(78, 205, 196, 0.1);
  overflow: hidden;
}

.results-count {
  padding: 1rem 1.2rem;
  background-color: rgba(78, 205, 196, 0.05);
  font-size: 1rem;
  color: var(--primary-dark);
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.results-count::before {
  content: "📊";
  font-size: 1.1rem;
}

.results-limit-notice {
  padding: 1rem 1.2rem;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-top: 1px solid rgba(255, 152, 0, 0.2);
  font-size: 0.95rem;
  color: #ef6c00;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: slideIn 0.3s ease-out;
}

.results-limit-notice::before {
  content: "⚠️";
  font-size: 1rem;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.5rem;
  border: 1px solid #f5c6cb;
  border-radius: 0.25rem;
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

  .basic-search-row {
    flex-direction: column;
    gap: 0.8rem;
  }

  .keyword-input-field {
    width: 100%;
  }

  .search-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-btn,
  .advanced-toggle-btn {
    flex: 1;
    height: 44px;
  }

  .options-row {
    flex-direction: column;
    gap: 1rem;
  }

  .option-group {
    width: 100%;
    flex: none;
  }

  .region-selects {
    flex-direction: column;
    gap: 0.5rem;
  }

  .region-select,
  .local-select,
  .content-type-select {
    width: 100%;
    min-width: 0;
  }

  .range-checkbox-wrapper,
  .range-slider-field {
    padding: 0.8rem;
  }

  .checkbox-label {
    font-size: 0.9rem;
  }

  .range-label {
    font-size: 0.9rem;
    margin-bottom: 0.6rem;
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

  /* 모바일에서 검색 결과 정보 박스 스타일 */
  .results-info {
    margin-bottom: 1.2rem;
    border-radius: 8px;
  }

  .results-count,
  .results-limit-notice {
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
  }

  .results-count::before,
  .results-limit-notice::before {
    font-size: 1rem;
  }
}
</style>