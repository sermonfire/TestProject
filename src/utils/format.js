/**
 * @description 格式化日期
 * @param {string|Date} date - 日期字符串或日期对象
 * @param {string} format - 格式化模式，默认为 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
    if (!date) return '暂无数据';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '无效日期';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
};

/**
 * @description 格式化金额
 * @param {number} amount - 金额
 * @param {number} decimals - 小数位数，默认为2
 * @param {string} currency - 货币符号，默认为'¥'
 * @returns {string} 格式化后的金额字符串
 */
export const formatCurrency = (amount, decimals = 2, currency = '¥') => {
    if (amount === undefined || amount === null) return '暂无数据';

    const num = parseFloat(amount);
    if (isNaN(num)) return '无效金额';

    return `${currency}${num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * @description 格式化时长（分钟转为小时和分钟）
 * @param {number} minutes - 分钟数
 * @returns {string} 格式化后的时长字符串
 */
export const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return '暂无数据';

    const num = parseInt(minutes, 10);
    if (isNaN(num)) return '无效时长';

    const hours = Math.floor(num / 60);
    const mins = num % 60;

    if (hours > 0) {
        return `${hours}小时${mins > 0 ? ` ${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
};

/**
 * @description 格式化数字（添加千位分隔符）
 * @param {number} num - 数字
 * @param {number} decimals - 小数位数，默认为0
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (num, decimals = 0) => {
    if (num === undefined || num === null) return '暂无数据';

    const number = parseFloat(num);
    if (isNaN(number)) return '无效数字';

    return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}; 