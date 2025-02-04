import { ElMessage } from 'element-plus';

// 封装统一的提示函数
export const showToast = (message, type = 'info', duration = 2000) => {
  ElMessage({
    message,
    type,
    duration,
    showClose: true
  });
}; 