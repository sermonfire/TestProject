/**
 * @description 城市名称映射工具
 */

// 导入城市编码数据
import regionCodes from '@/assets/data/region_codes.json'

// 用于快速查找的Map
const cityMap = new Map()
const districtMap = new Map()
const provinceMap = new Map()

// 初始化查找表
;(() => {
  regionCodes.provinces.forEach(province => {
    // 存储省份信息
    provinceMap.set(province.name, {
      code: province.code,
      shortName: province.name.replace(/省|市|自治区|特别行政区/, '')
    })

    // 处理直辖市
    if (!province.cities || province.cities.length === 0) {
      cityMap.set(province.name, {
        code: province.code,
        province: province.name,
        shortName: province.name.replace(/市/, '')
      })
      return
    }

    province.cities.forEach(city => {
      // 存储城市信息
      const cityShortName = city.name.replace(/市|自治州|地区|盟/, '')
      cityMap.set(city.name, {
        code: city.code,
        province: province.name,
        shortName: cityShortName
      })
      
      // 同时存储简称映射
      if (cityShortName !== city.name) {
        cityMap.set(cityShortName, {
          code: city.code,
          province: province.name,
          shortName: cityShortName,
          fullName: city.name
        })
      }
      
      // 存储区县信息
      city.districts?.forEach(district => {
        const districtShortName = district.name.replace(/区|县|市|自治县|自治旗|旗/, '')
        districtMap.set(district.name, {
          code: district.code,
          city: city.name,
          province: province.name,
          shortName: districtShortName
        })
        
        // 同时存储简称映射
        if (districtShortName !== district.name) {
          districtMap.set(districtShortName, {
            code: district.code,
            city: city.name,
            province: province.name,
            shortName: districtShortName,
            fullName: district.name
          })
        }
      })
    })
  })
})()

/**
 * @description 从目的地描述中提取省市信息
 * @param {string} description - 目的地描述
 * @returns {Object|null} 包含省份和城市的对象
 */
export const extractLocationFromDescription = (description) => {
  if (!description) return null
  
  // 1. 匹配省市模式
  const provincePattern = /^(.+?省)(.+?市)/
  const provinceMatch = description.match(provincePattern)
  
  if (provinceMatch) {
    const provinceName = provinceMatch[1]
    const cityName = provinceMatch[2]
    
    // 检查是否是有效城市
    if (provinceMap.has(provinceName) && cityMap.has(cityName)) {
      return {
        province: provinceName,
        city: cityName
      }
    }
  }
  
  // 2. 匹配直辖市模式
  const directCityPattern = /^(.+?市)/
  const directCityMatch = description.match(directCityPattern)
  
  if (directCityMatch) {
    const cityName = directCityMatch[1]
    if (provinceMap.has(cityName)) {
      return {
        province: cityName,
        city: cityName
      }
    }
  }
  
  // 3. 匹配自治区/自治州模式
  const autonomousPattern = /^(.+?自治区)?(.+?自治州)/
  const autonomousMatch = description.match(autonomousPattern)
  
  if (autonomousMatch) {
    const provinceName = autonomousMatch[1] || ''
    const regionName = autonomousMatch[2]
    if (cityMap.has(regionName)) {
      return {
        province: provinceName,
        city: regionName
      }
    }
  }
  
  // 4. 提取第一个地名（作为后备方案）
  const namePattern = /^([^省市区县，,]+?)[市区县，,]/
  const nameMatch = description.match(namePattern)
  
  if (nameMatch) {
    const extractedName = nameMatch[1].trim()
    
    // 检查是否是省份名称（针对直辖市）
    if (provinceMap.has(extractedName + '市')) {
      const cityName = extractedName + '市'
      return {
        province: cityName,
        city: cityName
      }
    }
    
    // 检查是否是城市名称
    if (cityMap.has(extractedName + '市')) {
      const cityName = extractedName + '市'
      const cityInfo = cityMap.get(cityName)
      return {
        province: cityInfo.province,
        city: cityName
      }
    }
    
    // 检查是否是区县名称
    if (districtMap.has(extractedName)) {
      const districtInfo = districtMap.get(extractedName)
      return {
        province: districtInfo.province,
        city: districtInfo.city
      }
    }
  }
  
  return null
}

/**
 * @description 验证城市名称是否有效
 * @param {string} cityName - 城市名称
 * @returns {boolean} 是否为有效城市
 */
export const isValidCity = (cityName) => {
  return cityMap.has(cityName)
}

/**
 * @description 获取城市的行政区划代码
 * @param {string} cityName - 城市名称
 * @returns {string|null} 城市代码
 */
export const getCityCode = (cityName) => {
  return cityMap.get(cityName)?.code || null
}

/**
 * @description 获取城市所属省份
 * @param {string} cityName - 城市名称
 * @returns {string|null} 省份名称
 */
export const getProvince = (cityName) => {
  return cityMap.get(cityName)?.province || null
}

/**
 * @description 从目的地数据中获取有效的城市名称
 * @param {Object} destination - 目的地数据
 * @returns {string|null} 有效的城市名称
 */
export const getValidCityFromDestination = (destination) => {
  if (!destination?.description) return null
  
  const locationInfo = extractLocationFromDescription(destination.description)
  
  if (locationInfo?.city && isValidCity(locationInfo.city)) {
    return locationInfo.city
  }
  
  return null
}

/**
 * @description 获取城市的完整信息
 * @param {string} cityName - 城市名称
 * @returns {Object|null} 城市信息
 */
export const getCityInfo = (cityName) => {
  const cityInfo = cityMap.get(cityName)
  if (!cityInfo) return null
  
  return {
    province: cityInfo.province,
    city: cityName,
    code: cityInfo.code,
    shortName: cityInfo.shortName,
    fullName: cityInfo.fullName || cityName
  }
}

/**
 * @description 获取城市的简称
 * @param {string} cityName - 城市名称
 * @returns {string} 城市简称
 */
export const getCityShortName = (cityName) => {
  return cityMap.get(cityName)?.shortName || cityName.replace(/市|自治州|地区|盟/, '')
}

/**
 * @description 从目的地数据中获取完整的位置信息
 * @param {Object} destination - 目的地数据
 * @returns {Object|null} 包含省份和城市的对象
 */
export const getLocationFromDestination = (destination) => {
  if (!destination?.description) return null
  
  const locationInfo = extractLocationFromDescription(destination.description)
  if (!locationInfo) return null
  
  const { province, city } = locationInfo
  if (!isValidCity(city)) return null
  
  return {
    province,
    city,
    cityCode: getCityCode(city),
    cityInfo: getCityInfo(city)
  }
} 