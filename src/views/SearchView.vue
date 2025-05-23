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
    async handleSearch() {
      this.isLoading = true
      this.errorMessage = ''
      this.clearMarkers()

      const params = {
        //query: this.searchTerm,
        metropolitanId: this.selectedRegion !== 'all' ? this.selectedRegion : null,
        localId: this.selectedLocal !== 'all' ? this.selectedLocal : null,
        contentTypeId: this.selectedContentType !== 'all' ? this.selectedContentType : null,
        isRangeSearch: true,
        latitude: this.map.getCenter().getLat(),
        longitude: this.map.getCenter().getLng(),
        range: 25,
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
          this.localOptions = data.locals.map(local => ({
            value: local.code,
            label: local.name
          }))
        } else {
          console.warn('예상하지 못한 API 응답 구조:', data)
          this.localOptions = []
        }

        console.log(`${metropolitanCode}에 대한 로컬 옵션 로드됨:`, this.localOptions)

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

        this.contentTypeOptions = contentTypes.map(type => ({
          value: type.id || type.code || type.typeId,
          label: type.name || type.typeName || type.title
        }))

        console.log('여행지 유형 옵션 로드됨:', this.contentTypeOptions)

      } catch (error) {
        console.error('여행지 유형 옵션 로딩 실패:', error)
        this.contentTypeOptions = []

        // 개발 환경에서 mock 데이터 사용
        if (import.meta.env?.DEV) {
          this.contentTypeOptions = this.getMockContentTypeOptions()
          console.log('Mock 여행지 유형 데이터 사용:', this.contentTypeOptions)
        }
      } finally {
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
      this.map = null
    },
  },

  async mounted() {
    console.log('SearchView 컴포넌트 마운트됨')

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
          <div class="search-form-row">
            <div class="search-form-field region-select">
              <select v-model="selectedRegion" @change="onRegionChange" class="form-control">
                <option
                  v-for="option in metropolitanOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div class="search-form-field local-select">
              <select
                v-model="selectedLocal"
                class="form-control"
                :disabled="selectedRegion === 'all' || isLoadingLocals"
              >
                <option value="all">
                  {{ isLoadingLocals ? '로딩 중...' : '전체 지역' }}
                </option>
                <option
                  v-for="local in localOptions"
                  :key="local.value"
                  :value="local.value"
                >
                  {{ local.label }}
                </option>
              </select>
            </div>

            <div class="search-form-field content-type-select">
              <select
                v-model="selectedContentType"
                class="form-control"
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
        <div class="content-row">
          <div class="map-section">
            <div id="kakao-map" class="map-container"></div>
          </div>

          <div class="results-section">
            <div class="search-results">
              <h2 class="results-title">검색 결과</h2>

              <div v-if="errorMessage" class="alert alert-danger">
                {{ errorMessage }}
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
  width: 15%;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

  .search-form-row {
    flex-direction: column;
  }

  .search-form-field {
    width: 100% !important;
    margin-bottom: 0.8rem;
  }

  .region-select,
  .local-select,
  .content-type-select,
  .keyword-input {
    width: 100% !important;
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
}
</style>