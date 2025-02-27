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
import { getLocalHotelAPI } from '@/api/localhotel'
import { ref, onMounted } from 'vue'

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
    const { province, city } = destinationAddressData.locationInfo
    const name = destinationAddressData.destinationData.destination.name
    const keyword = `${province}${city}${name}`
    const res = await getLocalHotelAPI(keyword, 1, 10)
    localHotelList.value = res.data
}

onMounted(() => {
    getLocalHotelList()
})

</script>

<style lang="scss" scoped></style>