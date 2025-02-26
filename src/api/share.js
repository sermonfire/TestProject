import request from '@/utils/request'

/**
 * 分享API接口
 */
export default {
    /**
     * 生成分享链接
     * @param {Object} data - 分享数据
     * @returns {Promise} 返回分享链接
     */
    generateShareLink(data) {
        return request({
            url: '/api/share/generate-link',
            method: 'post',
            data
        })
    },

    /**
     * 生成分享二维码
     * @param {string} url - 分享链接
     * @returns {Promise} 返回二维码图片URL
     */
    generateQRCode(url) {
        return request({
            url: '/api/share/generate-qrcode',
            method: 'post',
            data: { url }
        })
    },

    /**
     * 记录分享数据
     * @param {Object} data - 分享记录数据
     * @returns {Promise}
     */
    recordShare(data) {
        return request({
            url: '/api/share/record',
            method: 'post',
            data
        })
    },

    /**
     * 获取分享统计数据
     * @returns {Promise} 返回分享统计数据
     */
    getShareStats() {
        return request({
            url: '/api/share/stats',
            method: 'get'
        })
    }
} 