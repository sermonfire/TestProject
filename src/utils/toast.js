// 封装统一的提示函数
export const showToast = (title, icon = 'none', duration = 2000) => {
  // 确保当前没有其他 toast 在显示
  uni.hideToast();
  
  setTimeout(() => {
    uni.showToast({
      title,
      icon,
      duration,
      mask: true // 添加遮罩防止用户触摸
    });
  }, 100);
}; 