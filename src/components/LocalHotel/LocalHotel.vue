<template>
    <div class="local-hotel">
        <div class="local-hotel-header">
            <h2>本地酒店</h2>
        </div>
        <div class="local-hotel-list">
            <div class="local-hotel-item" v-for="item in localHotelList" :key="item.id">
                <div class="local-hotel-item-img">
                </div>
                <div class="local-hotel-item-info">
                    <h3>{{ item.name }}</h3>
                    <p>{{ item.type }}</p>
                    <p>{{ (item.pname) + (item.cityname) + (item.adname) + (item.address) }}</p>
                    <p>{{ '距离：' + getDistance(item.distance) }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useHotelStore } from '@/stores/hotelStore'

const hotelStore = useHotelStore()
const localHotelList = ref([])
const destinationAddressData = defineProps({
    destinationData: {
        type: Object,
        default: () => ({})
    },
    locationInfo: {
        type: Object,
        default: () => ({})
    }
})

const getDistance = (distance) => {
    if (distance) {
        if (distance < 1000) {
            return distance + '米'
        } else {
            return (distance / 1000).toFixed(2) + '千米'
        }
    } else {
        return '太远了！'
    }
}

const getLocalHotelList = async () => {
    if (!destinationAddressData.locationInfo?.province ||
        !destinationAddressData.locationInfo?.city ||
        !destinationAddressData.destinationData?.destination?.name) {
        return
    }

    const { province, city } = destinationAddressData.locationInfo
    const name = destinationAddressData.destinationData.destination.name
    const keyword = `${province}${city}${name}`
    const data = await hotelStore.getHotels(keyword, 1, 10)
    localHotelList.value = data
}

// 监听目的地信息变化
watch(
    () => [
        destinationAddressData.locationInfo?.province,
        destinationAddressData.locationInfo?.city,
        destinationAddressData.destinationData?.destination?.name
    ],
    () => {
        getLocalHotelList()
    },
    { immediate: true, deep: true }
)

onMounted(() => {
    getLocalHotelList()
})

</script>

<style lang="scss" scoped></style>