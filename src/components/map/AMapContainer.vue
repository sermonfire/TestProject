<!-- 高德地图容器组件 -->
<template>
    <div class="map-container">
        <div class="map-error" v-if="error">
            <el-alert :title="error" type="error" :closable="false" show-icon />
        </div>
        <div v-if="loading" class="map-loading">
            <el-skeleton style="width: 100%; height: 100%" animated />
        </div>
        <div :id="mapId" class="map" v-show="!error && !loading"></div>
        <div class="map-tools" v-show="!error && !loading">
            <el-button-group>
                <el-button type="primary" @click="handleLocate" :loading="locating">
                    <el-icon>
                        <Location />
                    </el-icon>
                    目标测距
                </el-button>
                <el-button type="primary" @click="handleSearch">
                    <el-icon>
                        <Search />
                    </el-icon>
                    搜索
                </el-button>
                <el-button type="primary" @click="toggleTraffic">
                    <el-icon>
                        <Van />
                    </el-icon>
                    路况
                </el-button>
                <el-button type="primary" @click="toggleSatellite">
                    <el-icon>
                        <Monitor />
                    </el-icon>
                    卫星
                </el-button>
                <el-button type="primary" @click="handleMeasure">
                    <el-icon>
                        <ScaleToOriginal />
                    </el-icon>
                    两点测距
                </el-button>
                <el-button type="primary" @click="toggleMarkerMode" :class="{ 'is-active': isMarkerMode }">
                    <el-icon>
                        <LocationFilled />
                    </el-icon>
                    添加标记
                </el-button>
                <el-button type="danger" @click="clearCustomMarkers">
                    <el-icon>
                        <Delete />
                    </el-icon>
                    清除标记
                </el-button>
            </el-button-group>
        </div>

        <!-- 搜索面板 -->
        <el-drawer v-model="searchDrawerVisible" title="地点搜索" direction="rtl" size="400px">
            <div class="search-panel">
                <el-input v-model="searchKeyword" placeholder="请输入地点关键词" clearable @keyup.enter="performSearch">
                    <template #append>
                        <el-button @click="performSearch">
                            <el-icon>
                                <Search />
                            </el-icon>
                        </el-button>
                    </template>
                </el-input>

                <div class="search-results" v-if="searchResults.length">
                    <el-scrollbar height="calc(100vh - 200px)">
                        <el-card v-for="(item, index) in searchResults" :key="index" class="search-result-item"
                            @click="handleSearchItemClick(item)">
                            <template #header>
                                <div class="result-title">
                                    <span>{{ item.name }}</span>
                                    <el-tag size="small" type="info">{{ item.type }}</el-tag>
                                </div>
                            </template>
                            <p class="result-address">{{ item.address }}</p>
                            <p class="result-distance" v-if="item.distance">
                                距离：{{ (item.distance / 1000).toFixed(2) }}km
                            </p>
                        </el-card>
                    </el-scrollbar>
                </div>
                <el-empty v-else-if="searchPerformed" description="未找到相关地点" />
            </div>
        </el-drawer>

        <!-- 路线规划面板 -->
        <el-drawer v-model="routePlanVisible" title="路线规划" direction="rtl" size="400px">
            <div class="route-plan-panel">
                <el-form>
                    <el-form-item>
                        <el-input v-model="startPoint" placeholder="起点">
                            <template #prepend>
                                <el-icon>
                                    <Position />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-input v-model="endPoint" placeholder="终点">
                            <template #prepend>
                                <el-icon>
                                    <LocationInformation />
                                </el-icon>
                            </template>
                        </el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-radio-group v-model="routeType">
                            <el-radio-button value="drive">驾车</el-radio-button>
                            <el-radio-button value="walk">步行</el-radio-button>
                            <el-radio-button value="transit">公交</el-radio-button>
                            <el-radio-button value="ride">骑行</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="calculateRoute" :loading="calculating">
                            开始规划
                        </el-button>
                    </el-form-item>
                </el-form>

                <div id="route-panel" class="route-result">
                    <el-descriptions v-if="routeResult" :column="1" border>
                        <el-descriptions-item label="距离">
                            {{ routeResult.distance }}km
                        </el-descriptions-item>
                        <el-descriptions-item label="预计时间">
                            {{ routeResult.duration }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <div class="route-steps" v-if="routeResult">
                        <el-steps direction="vertical" :active="1">
                            <el-step v-for="(step, index) in routeResult.steps" :key="index" :title="step.instruction"
                                :description="step.distance" />
                        </el-steps>
                    </div>
                </div>
            </div>
        </el-drawer>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Location, Search, Van, Monitor, ScaleToOriginal, Position, LocationInformation, LocationFilled, Delete } from '@element-plus/icons-vue'
import { debounce } from 'lodash-es'

const props = defineProps({
    longitude: {
        type: [String, Number],
        required: true,
        validator: (value) => {
            const num = typeof value === 'string' ? parseFloat(value) : value
            return !isNaN(num) && num >= -180 && num <= 180
        }
    },
    latitude: {
        type: [String, Number],
        required: true,
        validator: (value) => {
            const num = typeof value === 'string' ? parseFloat(value) : value
            return !isNaN(num) && num >= -90 && num <= 90
        }
    },
    zoom: {
        type: Number,
        default: 13,
        validator: (value) => value >= 3 && value <= 20
    },
    theme: {
        type: String,
        default: 'normal',
        validator: (value) => ['normal', 'dark', 'light', 'whitesmoke'].includes(value)
    },
    showToolbar: {
        type: Boolean,
        default: true
    },
    showScale: {
        type: Boolean,
        default: true
    },
    showMapType: {
        type: Boolean,
        default: true
    },
    enableScrollWheelZoom: {
        type: Boolean,
        default: true
    },
    enableDragging: {
        type: Boolean,
        default: true
    },
    enableKeyboard: {
        type: Boolean,
        default: true
    },
    enableDoubleClickZoom: {
        type: Boolean,
        default: true
    },
    markers: {
        type: Array,
        default: () => []
    }
})

/**
 * @description 生成唯一的地图容器ID
 */
const mapId = `map-container-${Math.random().toString(36).substring(2, 15)}`

/**
 * @description 地图实例
 * @type {AMap.Map}
 */
const map = ref(null)

/**
 * @description 定位插件
 * @type {AMap.Geolocation}
 */
const geolocation = ref(null)

/**
 * @description 标记点实例
 * @type {AMap.Marker}
 */
const marker = ref(null)

/**
 * @description 错误信息
 */
const error = ref('')

/**
 * @description 加载状态
 */
const loading = ref(true)

/**
 * @description 搜索相关
 */
const searchDrawerVisible = ref(false)
const searchKeyword = ref('')
const searchResults = ref([])
const searchPerformed = ref(false)
const placeSearch = ref(null)

/**
 * @description 路况图层
 */
const trafficLayer = ref(null)
const satelliteLayer = ref(null)
const isTrafficVisible = ref(false)
const isSatelliteVisible = ref(false)

/**
 * @description 测距工具
 */
const ruler = ref(null)
const isMeasuring = ref(false)

/**
 * @description 路线规划相关
 */
const routePlanVisible = ref(false)
const startPoint = ref('')
const endPoint = ref('')
const routeType = ref('drive')
const routeResult = ref(null)
const calculating = ref(false)
const driving = ref(null)
const walking = ref(null)
const transit = ref(null)
const riding = ref(null)

/**
 * @description 定位状态
 */
const locating = ref(false)

/**
 * @description 当前位置
 */
const currentPosition = ref(null)

/**
 * @description 信息窗体实例
 * @type {AMap.InfoWindow}
 */
const infoWindow = ref(null)

/**
 * @description 标记点模式
 */
const isMarkerMode = ref(false)

/**
 * @description 自定义标记点列表
 */
const customMarkers = ref([])

/**
 * @description 目的地标记点
 */
const destinationMarker = ref(null)

/**
 * @description 缓存相关
 */
const CACHE_KEY_PREFIX = 'amap_'
const CACHE_EXPIRATION = 1000 * 60 * 60 // 1小时

/**
 * @description 缓存管理器
 */
const cacheManager = {
    set(key, value, expiration = CACHE_EXPIRATION) {
        const item = {
            value,
            timestamp: Date.now() + expiration
        }
        localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(item))
    },

    get(key) {
        const item = localStorage.getItem(CACHE_KEY_PREFIX + key)
        if (!item) return null

        const { value, timestamp } = JSON.parse(item)
        if (Date.now() > timestamp) {
            localStorage.removeItem(CACHE_KEY_PREFIX + key)
            return null
        }

        return value
    },

    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(CACHE_KEY_PREFIX))
            .forEach(key => localStorage.removeItem(key))
    }
}

/**
 * @description 防抖处理
 */
const debouncedSearch = debounce((keyword) => {
    if (!placeSearch.value) return
    doSearch(keyword)
}, 500)

const debouncedUpdateMarker = debounce(() => {
    if (!loading.value) {
        updateMarkerPosition()
    }
}, 100)

/**
 * @description 懒加载相关
 */
const mapScriptLoaded = ref(false)
const loadMapScript = () => {
    if (window.AMap) {
        mapScriptLoaded.value = true
        return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.async = true
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${process.env.VUE_APP_AMAP_KEY}`
        script.onerror = reject
        script.onload = () => {
            mapScriptLoaded.value = true
            resolve()
        }
        document.head.appendChild(script)
    })
}

/**
 * @description 将坐标转换为数字
 * @param {string | number} value - 坐标值
 * @returns {number} - 转换后的数字
 */
const parseCoordinate = (value) => {
    if (value === undefined || value === null) return null
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    // 保留6位小数，避免精度问题
    return isNaN(num) ? null : Number(num.toFixed(6))
}

/**
 * @description 验证坐标是否有效
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @returns {boolean} - 坐标是否有效
 */
const isValidCoordinates = (lng, lat) => {
    return lng !== null && lat !== null &&
        lng >= -180 && lng <= 180 &&
        lat >= -90 && lat <= 90
}

/**
 * @description 等待DOM更新
 */
const waitForContainer = async () => {
    await nextTick()
    return new Promise((resolve) => {
        const checkContainer = setInterval(() => {
            const container = document.getElementById(mapId)
            if (container) {
                clearInterval(checkContainer)
                resolve(container)
            }
        }, 100)

        // 设置超时
        setTimeout(() => {
            clearInterval(checkContainer)
            resolve(null)
        }, 5000)
    })
}

/**
 * @description 优化后的初始化函数
 */
const initMap = async () => {
    try {
        loading.value = true
        error.value = ''

        // 懒加载地图脚本
        await loadMapScript()

        // 等待容器和API准备就绪
        const container = await waitForContainer()
        if (!container) {
            throw new Error('地图容器不存在')
        }

        const lng = parseCoordinate(props.longitude)
        const lat = parseCoordinate(props.latitude)

        if (!isValidCoordinates(lng, lat)) {
            throw new Error('无效的坐标位置')
        }

        // 尝试从缓存获取地图配置
        const cachedConfig = cacheManager.get('map_config')
        const config = cachedConfig || {
            zoom: 13,
            center: [lng, lat],
            viewMode: '2D',
            resizeEnable: true
        }

        // 销毁已存在的地图实例
        if (map.value) {
            map.value.destroy()
            map.value = null
        }

        // 创建地图实例
        map.value = new AMap.Map(mapId, config)

        // 等待地图加载完成
        await new Promise((resolve) => {
            if (map.value.getStatus() === 'complete') {
                resolve()
            } else {
                map.value.on('complete', resolve)
            }
        })

        // 缓存地图配置
        if (!cachedConfig) {
            cacheManager.set('map_config', config)
        }

        // 异步加载插件
        await loadPlugins()

        loading.value = false
    } catch (err) {
        console.error('初始化地图失败:', err)
        error.value = err.message || '初始化地图失败'
        ElMessage.error(error.value)
        loading.value = false
    }
}

/**
 * @description 异步加载插件
 */
const loadPlugins = () => {
    return new Promise((resolve, reject) => {
        AMap.plugin([
            'AMap.Scale',
            'AMap.ToolBar',
            'AMap.MapType',
            'AMap.Geolocation',
            'AMap.PlaceSearch',
            'AMap.Driving',
            'AMap.Walking',
            'AMap.Transfer',
            'AMap.Riding'
        ], () => {
            try {
                initPlugins()
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    })
}

/**
 * @description 初始化插件
 */
const initPlugins = () => {
    // 添加地图控件
    map.value.addControl(new AMap.Scale())
    map.value.addControl(new AMap.ToolBar())
    map.value.addControl(new AMap.MapType())

    // 创建标记点
    if (marker.value) {
        marker.value.setMap(null)
        marker.value = null
    }

    const center = map.value.getCenter()
    marker.value = createClickableMarker(center)
    marker.value.setMap(map.value)

    // 创建信息窗体
    infoWindow.value = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -30),
        closeWhenClickMap: true
    })

    // 初始化定位插件
    geolocation.value = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        buttonPosition: 'RB',
        buttonOffset: new AMap.Pixel(10, 20),
        zoomToAccuracy: true
    })
    map.value.addControl(geolocation.value)
}

/**
 * @description 计算两点之间的距离
 * @param {AMap.LngLat} point1 - 起点
 * @param {AMap.LngLat} point2 - 终点
 * @returns {string} - 格式化后的距离
 */
const calculateDistance = (point1, point2) => {
    const distance = point1.distance(point2)
    if (distance > 1000) {
        return `${(distance / 1000).toFixed(2)}公里`
    }
    return `${distance.toFixed(0)}米`
}

/**
 * @description 处理定位
 */
const handleLocate = () => {
    if (!geolocation.value) {
        ElMessage.warning('定位插件未初始化')
        return
    }

    locating.value = true
    geolocation.value.getCurrentPosition((status, result) => {
        locating.value = false
        if (status === 'complete') {
            const { position } = result
            currentPosition.value = new AMap.LngLat(position.lng, position.lat)
            map.value.setCenter(position)

            // 更新当前位置标记点
            if (marker.value) {
                marker.value.setPosition(position)
            }

            // 确保目的地标记点存在
            const destinationPosition = new AMap.LngLat(
                parseCoordinate(props.longitude),
                parseCoordinate(props.latitude)
            )

            if (!destinationMarker.value) {
                destinationMarker.value = createClickableMarker(destinationPosition, {
                    content: '<div class="destination-marker"></div>',
                    offset: new AMap.Pixel(-10, -10)
                })
                destinationMarker.value.setMap(map.value)
            }

            const distance = calculateDistance(currentPosition.value, destinationPosition)
            ElMessage.success(`定位成功：当前位置\n距离目的地：${distance}`)

            // 绘制连线
            drawRouteLine(currentPosition.value, destinationPosition)

            // 调整视野以包含所有点
            map.value.setFitView([marker.value, destinationMarker.value])
        } else {
            ElMessage.error('定位失败')
        }
    })
}

/**
 * @description 绘制路线
 */
const routeLine = ref(null)

/**
 * @description 绘制两点之间的连线
 * @param {AMap.LngLat} start - 起点
 * @param {AMap.LngLat} end - 终点
 */
const drawRouteLine = (start, end) => {
    // 清除已有的线
    if (routeLine.value) {
        routeLine.value.setMap(null)
        routeLine.value = null
    }

    // 创建新的线
    routeLine.value = new AMap.Polyline({
        path: [start, end],
        strokeColor: '#409EFF',
        strokeWeight: 3,
        strokeOpacity: 0.8,
        strokeStyle: 'dashed',
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 50
    })

    // 添加到地图
    routeLine.value.setMap(map.value)

    // 调整视野以包含所有点
    const startMarker = createClickableMarker(start)
    const endMarker = createClickableMarker(end)

    map.value.setFitView([startMarker, endMarker])

    // 清理临时标记点
    setTimeout(() => {
        startMarker.setMap(null)
        endMarker.setMap(null)
    }, 100)
}

/**
 * @description 处理搜索
 */
const handleSearch = () => {
    if (!map.value) {
        ElMessage.warning('地图尚未初始化')
        return
    }

    // 初始化搜索服务
    if (!placeSearch.value) {
        placeSearch.value = new AMap.PlaceSearch({
            map: map.value,
            pageSize: 10,
            extensions: 'all',
            type: '风景名胜|商场购物|餐饮服务|生活服务|住宿服务'
        })
    }

    // 显示搜索面板
    searchDrawerVisible.value = true
    searchKeyword.value = ''
    searchResults.value = []
    searchPerformed.value = false
}

/**
 * @description 执行搜索
 */
const doSearch = (keyword) => {
    if (!placeSearch.value || !keyword.trim()) {
        return
    }

    searchResults.value = []
    searchPerformed.value = true

    // 获取当前地图中心点作为搜索中心
    const center = map.value.getCenter()

    placeSearch.value.searchNearBy(keyword, center, 5000, (status, result) => {
        if (status === 'complete' && result.poiList && result.poiList.pois) {
            // 处理搜索结果
            searchResults.value = result.poiList.pois.map(poi => ({
                name: poi.name,
                type: poi.type,
                address: poi.address,
                distance: poi.distance,
                location: poi.location,
                tel: poi.tel || '暂无电话',
                rating: poi.biz_ext?.rating || '暂无评分'
            }))

            if (searchResults.value.length === 0) {
                ElMessage.info('未找到相关地点')
            }
        } else {
            ElMessage.error('搜索失败：' + (result.info || '未知错误'))
        }
    })
}

/**
 * @description 处理搜索结果点击
 */
const handleSearchItemClick = (item) => {
    if (!map.value || !item.location) return

    const position = new AMap.LngLat(item.location.lng, item.location.lat)
    map.value.setCenter(position)
    map.value.setZoom(15)

    // 添加标记
    if (marker.value) {
        marker.value.setPosition(position)
    } else {
        marker.value = createClickableMarker(position)
        marker.value.setMap(map.value)
    }

    searchDrawerVisible.value = false
}

/**
 * @description 计算路线
 */
const calculateRoute = () => {
    if (!startPoint.value || !endPoint.value) {
        ElMessage.warning('请输入起点和终点')
        return
    }

    calculating.value = true
    routeResult.value = null

    const routeSearch = {
        drive: () => calculateDriving(),
        walk: () => calculateWalking(),
        transit: () => calculateTransit(),
        ride: () => calculateRiding()
    }

    routeSearch[routeType.value]()
}

/**
 * @description 搜索路线
 */
const searchRoute = () => {
    try {
        // 构建起点参数
        let start = null
        if (startPoint.value === '我的位置' && currentPosition.value) {
            start = currentPosition.value
        } else if (startPoint.value) {
            start = startPoint.value
        }

        // 构建终点参数
        let end = null
        if (typeof endPoint.value === 'object' && endPoint.value.getLng && endPoint.value.getLat) {
            end = endPoint.value
        } else if (endPoint.value) {
            end = endPoint.value
        }

        // 验证参数
        if (!start || !end) {
            calculating.value = false
            ElMessage.warning('请输入有效的起点和终点')
            return
        }

        // 创建结果显示面板
        const panel = document.getElementById('route-panel')
        if (!panel) {
            calculating.value = false
            ElMessage.error('路线规划面板不存在')
            return
        }

        // 设置路线规划参数
        const options = {
            map: map.value,
            panel: 'route-panel',
            city: '全国',
            autoFitView: true,
            showTraffic: true
        }

        // 根据路线类型设置特定参数
        if (routeType.value === 'drive') {
            options.policy = AMap.DrivingPolicy.LEAST_TIME
        } else if (routeType.value === 'transit') {
            options.nightflag = true
            options.city = '全国'
        }

        // 根据路线类型创建对应的服务实例
        let routeService = null
        switch (routeType.value) {
            case 'drive':
                routeService = new AMap.Driving(options)
                break
            case 'walk':
                routeService = new AMap.Walking(options)
                break
            case 'transit':
                routeService = new AMap.Transfer(options)
                break
            case 'ride':
                routeService = new AMap.Riding(options)
                break
            default:
                throw new Error('不支持的路线类型')
        }

        // 执行路线搜索
        routeService.search(start, end, (status, result) => {
            calculating.value = false

            if (status === 'complete' && result.routes && result.routes.length) {
                const route = result.routes[0]
                routeResult.value = {
                    distance: (route.distance / 1000).toFixed(2),
                    duration: formatDuration(route.time),
                    steps: route.steps.map(step => ({
                        instruction: step.instruction,
                        distance: `${(step.distance / 1000).toFixed(2)}km`
                    }))
                }

                ElMessage.success('路线规划成功')
            } else {
                console.error('路线规划失败:', result)
                ElMessage.error('路线规划失败：' + (result.info || '未知错误'))
            }
        })
    } catch (error) {
        calculating.value = false
        console.error('路线规划服务错误:', error)
        ElMessage.error('路线规划服务错误：' + error.message)
    }
}

/**
 * @description 计算驾车路线
 */
const calculateDriving = () => {
    AMap.plugin(['AMap.Driving'], () => {
        searchRoute()
    })
}

/**
 * @description 计算步行路线
 */
const calculateWalking = () => {
    AMap.plugin(['AMap.Walking'], () => {
        searchRoute()
    })
}

/**
 * @description 计算公交路线
 */
const calculateTransit = () => {
    AMap.plugin(['AMap.Transfer'], () => {
        searchRoute()
    })
}

/**
 * @description 计算骑行路线
 */
const calculateRiding = () => {
    AMap.plugin(['AMap.Riding'], () => {
        searchRoute()
    })
}

/**
 * @description 格式化时间
 */
const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
}

/**
 * @description 处理标记点点击事件
 * @param {AMap.Marker} clickedMarker - 被点击的标记点
 */
const handleMarkerClick = async (clickedMarker) => {
    if (!map.value || !clickedMarker || !infoWindow.value) return

    try {
        const position = clickedMarker.getPosition()

        // 构建基本信息
        let markerInfo = {
            name: '未知位置',
            address: `${position.getLng()}, ${position.getLat()}`,
            type: '地点',
            tel: '暂无电话',
            rating: '暂无评分'
        }

        try {
            // 尝试获取周边POI信息
            const placeSearch = new AMap.PlaceSearch({
                radius: 100,  // 增加搜索半径
                extensions: 'all',
                type: '风景名胜|商场购物|餐饮服务|生活服务|住宿服务'  // 添加更多POI类型
            })

            const searchResult = await new Promise((resolve, reject) => {
                placeSearch.searchNearBy('', position, 100, (status, result) => {
                    if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
                        const poi = result.poiList.pois[0]
                        resolve({
                            name: poi.name,
                            address: poi.address || markerInfo.address,
                            type: poi.type || markerInfo.type,
                            tel: poi.tel || markerInfo.tel,
                            rating: poi.biz_ext?.rating || markerInfo.rating
                        })
                    } else {
                        reject(new Error('未找到POI信息'))
                    }
                })
            })

            // 更新标记点信息
            markerInfo = searchResult
        } catch (searchError) {
            console.log('POI搜索未找到结果，使用默认信息')
        }

        // 为路线规划准备终点信息
        endPoint.value = markerInfo.name

        // 构建信息窗体内容
        const content = `
            <div class="info-window" style="padding: 15px;">
                <h3 style="margin:0 0 10px;padding:0;font-size:16px;color:#333;font-weight:600;">
                    ${markerInfo.name}
                    ${markerInfo.rating !== '暂无评分' ?
                `<span style="font-size:14px;color:#ff9900;margin-left:10px;">⭐${markerInfo.rating}</span>` :
                ''}
                </h3>
                <div style="font-size:14px;color:#666;line-height:1.6;">
                    <p style="margin:5px 0;">
                        <span style="color:#409EFF;">类型：</span>${markerInfo.type}
                    </p>
                    <p style="margin:5px 0;">
                        <span style="color:#409EFF;">地址：</span>${markerInfo.address}
                    </p>
                    <p style="margin:5px 0;">
                        <span style="color:#409EFF;">电话：</span>${markerInfo.tel}
                    </p>
                    <p style="margin:5px 0;">
                        <span style="color:#409EFF;">坐标：</span>${position.getLng()}, ${position.getLat()}
                    </p>
                </div>
                <div style="margin-top:15px;text-align:center;">
                    <button id="planRouteBtn" 
                            style="padding:8px 15px;background:#409EFF;color:white;border:none;border-radius:4px;cursor:pointer;width:100%;">
                        规划路线
                    </button>
                </div>
            </div>
        `

        // 打开信息窗体
        infoWindow.value.setContent(content)
        infoWindow.value.open(map.value, position)

        // 添加点击事件监听器
        setTimeout(() => {
            const planRouteBtn = document.getElementById('planRouteBtn')
            if (planRouteBtn) {
                planRouteBtn.addEventListener('click', () => {
                    if (currentPosition.value) {
                        startPoint.value = '我的位置'
                    }
                    routePlanVisible.value = true
                })
            }
        }, 0)
    } catch (error) {
        console.error('处理标记点点击事件失败:', error)
        ElMessage.warning('获取位置信息失败，请重试')
    }
}

/**
 * @description 切换标记点模式
 */
const toggleMarkerMode = () => {
    isMarkerMode.value = !isMarkerMode.value
    if (isMarkerMode.value) {
        map.value.setDefaultCursor('crosshair')
        // 添加点击事件监听器
        map.value.on('click', handleMapClick)
        ElMessage.info('点击地图添加标记点')
    } else {
        map.value.setDefaultCursor('default')
        // 移除点击事件监听器
        map.value.off('click', handleMapClick)
    }
}

/**
 * @description 处理地图点击事件
 */
const handleMapClick = (e) => {
    if (!isMarkerMode.value) return

    const position = e.lnglat
    const newMarker = createClickableMarker(position, {
        draggable: true,
        animation: 'AMAP_ANIMATION_DROP'
    })

    newMarker.setMap(map.value)
    customMarkers.value.push(newMarker)
}

/**
 * @description 清除自定义标记点
 */
const clearCustomMarkers = () => {
    customMarkers.value.forEach(marker => {
        marker.setMap(null)
    })
    customMarkers.value = []
    ElMessage.success('已清除所有自定义标记点')
}

/**
 * @description 切换路况图层显示
 */
const toggleTraffic = () => {
    if (!map.value) return

    if (!trafficLayer.value) {
        trafficLayer.value = new AMap.TileLayer.Traffic({
            zIndex: 10
        })
    }

    if (!isTrafficVisible.value) {
        trafficLayer.value.setMap(map.value)
        isTrafficVisible.value = true
        ElMessage.success('已开启路况图层')
    } else {
        trafficLayer.value.setMap(null)
        isTrafficVisible.value = false
        ElMessage.success('已关闭路况图层')
    }
}

/**
 * @description 切换卫星图层显示
 */
const toggleSatellite = () => {
    if (!map.value) return

    if (!satelliteLayer.value) {
        satelliteLayer.value = new AMap.TileLayer.Satellite({
            zIndex: 9
        })
    }

    if (!isSatelliteVisible.value) {
        satelliteLayer.value.setMap(map.value)
        isSatelliteVisible.value = true
        ElMessage.success('已开启卫星图层')
    } else {
        satelliteLayer.value.setMap(null)
        isSatelliteVisible.value = false
        ElMessage.success('已关闭卫星图层')
    }
}

/**
 * @description 处理测距
 */
const handleMeasure = () => {
    if (!map.value) return

    if (!ruler.value) {
        ruler.value = new AMap.RangingTool(map.value)

        ruler.value.on('end', (result) => {
            const distance = result.distance
            const formattedDistance = distance > 1000 ?
                `${(distance / 1000).toFixed(2)}公里` :
                `${distance.toFixed(0)}米`

            ElMessage.success(`测距结果：${formattedDistance}`)
            isMeasuring.value = false
            ruler.value.turnOff()
        })
    }

    if (!isMeasuring.value) {
        ruler.value.turnOn()
        isMeasuring.value = true
        ElMessage.info('请在地图上点击起点和终点进行测距')
    } else {
        ruler.value.turnOff()
        isMeasuring.value = false
    }
}

/**
 * @description 执行搜索操作
 */
const performSearch = () => {
    if (!searchKeyword.value.trim()) {
        ElMessage.warning('请输入搜索关键词')
        return
    }
    doSearch(searchKeyword.value.trim())
}

// 生命周期钩子
onMounted(() => {
    initMap()
})

onUnmounted(() => {
    // 清理缓存
    cacheManager.clear()

    // 清理地图实例
    if (map.value) {
        map.value.destroy()
        map.value = null
    }

    // 清理其他资源
    clearResources()
})

// 清理资源
const clearResources = () => {
    if (marker.value) {
        marker.value.setMap(null)
        marker.value = null
    }
    if (destinationMarker.value) {
        destinationMarker.value.setMap(null)
        destinationMarker.value = null
    }
    if (routeLine.value) {
        routeLine.value.setMap(null)
        routeLine.value = null
    }
    if (infoWindow.value) {
        infoWindow.value.close()
        infoWindow.value = null
    }
    clearCustomMarkers()
}

// 添加错误边界
const ErrorBoundary = {
    name: 'ErrorBoundary',
    data() {
        return {
            hasError: false,
            error: null
        }
    },
    methods: {
        handleError(error) {
            this.hasError = true
            this.error = error
            console.error('地图组件错误:', error)
            ElMessage.error('地图组件发生错误，请刷新页面重试')
        }
    },
    render() {
        if (this.hasError) {
            return h('div', {
                class: 'map-error'
            }, [
                h('el-result', {
                    icon: 'error',
                    title: '地图加载失败',
                    subTitle: this.error?.message || '请刷新页面重试'
                })
            ])
        }
        return this.$slots.default()
    }
}

// 添加性能监控
const usePerformanceMonitor = () => {
    const startTime = ref(Date.now())
    const loadTime = ref(0)
    const renderCount = ref(0)

    watch(renderCount, (newCount) => {
        if (newCount > 60) {
            console.warn('地图渲染次数过多，可能存在性能问题')
        }
    })

    return {
        startTime,
        loadTime,
        renderCount
    }
}

// 添加地图事件处理
const useMapEvents = (map) => {
    const events = {
        click: (e) => handleMapClick(e),
        dragstart: () => {
            isDragging.value = true
        },
        dragend: () => {
            isDragging.value = false
            const center = map.value?.getCenter()
            if (center) {
                emit('center-change', {
                    lng: center.getLng(),
                    lat: center.getLat()
                })
            }
        },
        zoomchange: () => {
            const zoom = map.value?.getZoom()
            if (zoom !== undefined) {
                emit('zoom-change', zoom)
            }
        },
        movestart: () => {
            isMoving.value = true
        },
        moveend: () => {
            isMoving.value = false
            const bounds = map.value?.getBounds()
            if (bounds && bounds.northeast && bounds.southwest) {
                emit('bounds-change', {
                    northeast: {
                        lng: bounds.northeast.getLng(),
                        lat: bounds.northeast.getLat()
                    },
                    southwest: {
                        lng: bounds.southwest.getLng(),
                        lat: bounds.southwest.getLat()
                    }
                })
            }
        }
    }

    const bindEvents = () => {
        if (!map.value) return
        Object.entries(events).forEach(([event, handler]) => {
            map.value.on(event, handler)
        })
    }

    const unbindEvents = () => {
        if (!map.value) return
        Object.entries(events).forEach(([event, handler]) => {
            map.value.off(event, handler)
        })
    }

    return {
        bindEvents,
        unbindEvents
    }
}

// 添加错误处理
const handleError = (error, source) => {
    console.error(`地图${source}错误:`, error)
    error.value = `地图${source}错误: ${error.message}`
    ElMessage.error(error.value)
}

// 添加地图状态管理
const useMapState = () => {
    const isDragging = ref(false)
    const isMoving = ref(false)
    const mapStatus = computed(() => ({
        isReady: !loading.value && !error.value,
        isDragging: isDragging.value,
        isMoving: isMoving.value,
        zoom: map.value?.getZoom(),
        center: map.value?.getCenter(),
        bounds: map.value?.getBounds()
    }))

    return {
        isDragging,
        isMoving,
        mapStatus
    }
}

// 添加地图控制接口
const useMapControl = () => {
    const fitBounds = (bounds) => {
        if (!map.value) return
        map.value.setBounds(new AMap.Bounds(
            new AMap.LngLat(bounds.southwest.lng, bounds.southwest.lat),
            new AMap.LngLat(bounds.northeast.lng, bounds.northeast.lat)
        ))
    }

    const panTo = (position) => {
        if (!map.value) return
        map.value.panTo(new AMap.LngLat(position.lng, position.lat))
    }

    const setZoom = (zoom) => {
        if (!map.value) return
        map.value.setZoom(zoom)
    }

    return {
        fitBounds,
        panTo,
        setZoom
    }
}

// 添加地图工具函数
const useMapUtils = () => {
    const calculateBoundingBox = (points) => {
        if (!points || points.length === 0) return null

        let minLng = Infinity
        let maxLng = -Infinity
        let minLat = Infinity
        let maxLat = -Infinity

        points.forEach(point => {
            minLng = Math.min(minLng, point.lng)
            maxLng = Math.max(maxLng, point.lng)
            minLat = Math.min(minLat, point.lat)
            maxLat = Math.max(maxLat, point.lat)
        })

        return {
            northeast: { lng: maxLng, lat: maxLat },
            southwest: { lng: minLng, lat: minLat }
        }
    }

    const isPointInBounds = (point, bounds) => {
        return point.lng >= bounds.southwest.lng &&
            point.lng <= bounds.northeast.lng &&
            point.lat >= bounds.southwest.lat &&
            point.lat <= bounds.northeast.lat
    }

    return {
        calculateBoundingBox,
        isPointInBounds
    }
}

// 添加地图主题切换
const useMapTheme = () => {
    const currentTheme = ref('normal')
    const availableThemes = [
        { key: 'normal', name: '默认' },
        { key: 'dark', name: '暗黑' },
        { key: 'light', name: '明亮' },
        { key: 'whitesmoke', name: '雾灰' }
    ]

    const setMapStyle = (style) => {
        if (!map.value) return
        map.value.setMapStyle(`amap://styles/${style}`)
        currentTheme.value = style
    }

    watch(() => currentTheme.value, (newTheme) => {
        setMapStyle(newTheme)
    })

    return {
        currentTheme,
        availableThemes,
        setMapStyle
    }
}

// 组件接口定义
const emit = defineEmits([
    'update:modelValue',
    'center-change',
    'zoom-change',
    'bounds-change',
    'marker-click',
    'map-click',
    'error'
])

// 组合式API集成
const { startTime, loadTime, renderCount } = usePerformanceMonitor()
const { isDragging, isMoving, mapStatus } = useMapState()
const { bindEvents, unbindEvents } = useMapEvents(map)
const { fitBounds, panTo, setZoom } = useMapControl()
const { calculateBoundingBox, isPointInBounds } = useMapUtils()
const { currentTheme, availableThemes, setMapStyle } = useMapTheme()

// 初始化地图
onMounted(async () => {
    try {
        await initMap()
        bindEvents()
        setMapStyle(props.theme)
    } catch (error) {
        handleError(error, '初始化')
    }
})

// 清理资源
onUnmounted(() => {
    unbindEvents()
    clearResources()
})

// 导出组件接口
defineExpose({
    map,
    mapStatus,
    fitBounds,
    panTo,
    setZoom,
    setMapStyle
})

/**
 * @description 创建可点击的标记点
 * @param {AMap.LngLat} position - 标记点位置
 * @param {Object} options - 标记点配置选项
 * @returns {AMap.Marker} - 标记点实例
 */
const createClickableMarker = (position, options = {}) => {
    const defaultOptions = {
        position,
        offset: new AMap.Pixel(-10, -10),
        icon: new AMap.Icon({
            size: new AMap.Size(20, 20),
            imageSize: new AMap.Size(20, 20),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png'
        }),
        anchor: 'bottom-center',
        draggable: false,
        cursor: 'pointer',
        animation: 'AMAP_ANIMATION_BOUNCE'
    }

    const marker = new AMap.Marker({
        ...defaultOptions,
        ...options
    })

    // 添加点击事件监听器
    marker.on('click', () => {
        handleMarkerClick(marker)
    })

    return marker
}
</script>

<style scoped>
.map-container {
    position: relative;
    width: 100%;
    height: 600px;
    transition: all 0.3s ease;
}

.map {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.map-error {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background-color: var(--el-color-danger-lighter);
    border-radius: 8px;
    transition: all 0.3s ease;
}

.map-loading {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--el-color-info-lighter);
    display: flex;
    align-items: center;
    justify-content: center;
}

.map-loading .el-skeleton {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
            var(--el-color-info-lighter) 25%,
            var(--el-color-info-light) 50%,
            var(--el-color-info-lighter) 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}

.map-tools {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 100;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.map-tools .el-button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 5px;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.map-tools .el-button {
    transition: all 0.3s ease;
}

.map-tools .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.is-active {
    background-color: var(--el-color-primary) !important;
    border-color: var(--el-color-primary) !important;
    color: white !important;
    transform: translateY(-2px);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.destination-marker {
    width: 20px;
    height: 30px;
    border-radius: 50%;
    background-color: var(--el-color-danger);
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    cursor: pointer;
}

.destination-marker:hover {
    transform: scale(1.2);
}

:deep(.amap-marker-label) {
    border: none;
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 4px;
    padding: 8px 12px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    font-size: 14px;
    line-height: 1.5;
    transition: all 0.3s ease;
}

:deep(.amap-marker-label:hover) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}

.route-result {
    padding: 15px;
    max-height: calc(100vh - 300px);
    overflow-y: auto;
    background-color: var(--el-color-info-lighter);
    border-radius: 4px;
}

.route-result::-webkit-scrollbar {
    width: 6px;
}

.route-result::-webkit-scrollbar-thumb {
    background-color: var(--el-color-primary-light-5);
    border-radius: 3px;
}

.route-result::-webkit-scrollbar-track {
    background-color: var(--el-color-info-lighter);
}

:deep(.amap-lib-driving) {
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    background-color: white;
}

:deep(.amap-lib-driving .planTitle) {
    background-color: var(--el-color-primary-light-8);
    padding: 12px;
    border-radius: 4px 4px 0 0;
    font-weight: bold;
}

:deep(.amap-lib-driving) dt {
    background-color: var(--el-color-primary-light-9);
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 5px;
}

:deep(.amap-lib-driving) dd.amap-lib-driving-item {
    padding: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;
}

:deep(.amap-lib-driving) dd.amap-lib-driving-item:hover {
    background-color: var(--el-color-primary-light-9);
    transform: translateX(5px);
}

.search-panel {
    padding: 15px;
}

.search-results {
    margin-top: 15px;
}

.search-result-item {
    margin-bottom: 10px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.search-result-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
}

.result-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.result-address {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    margin: 5px 0;
}

.result-distance {
    color: var(--el-color-success);
    font-size: 14px;
    margin: 0;
}

.info-window {
    max-width: 300px;
}

.info-window h3 {
    margin: 0 0 10px;
    padding: 0;
    font-size: 16px;
    color: var(--el-text-color-primary);
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
}

.info-window p {
    margin: 5px 0;
    font-size: 14px;
    color: var(--el-text-color-regular);
    line-height: 1.6;
}

.info-window button {
    margin-top: 15px;
    width: 100%;
    padding: 8px 15px;
    background-color: var(--el-color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.info-window button:hover {
    background-color: var(--el-color-primary-dark-2);
    transform: translateY(-2px);
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
    .map-container {
        height: 300px;
    }

    .map-tools {
        width: calc(100% - 20px);
    }

    .map-tools .el-button-group {
        width: 100%;
        justify-content: center;
    }

    .map-tools .el-button {
        padding: 8px;
    }

    .map-tools .el-button span {
        display: none;
    }

    .info-window {
        max-width: 250px;
    }
}

@media screen and (max-width: 480px) {
    .map-container {
        height: 250px;
    }

    .map-tools .el-button {
        padding: 6px;
    }

    .info-window {
        max-width: 200px;
    }
}
</style>