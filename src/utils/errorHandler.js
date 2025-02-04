export const ErrorCode = {
  SUCCESS: 0,
  TOKEN_INVALID: 401,
  PARAM_ERROR: 400,
  SERVER_ERROR: 500
};

export const ErrorMessage = {
  [ErrorCode.TOKEN_INVALID]: '登录已过期，请重新登录',
  [ErrorCode.PARAM_ERROR]: '参数错误',
  [ErrorCode.SERVER_ERROR]: '服务器错误'
};

export const handleError = (code, message) => {
  uni.showToast({
    title: message || ErrorMessage[code] || '操作失败',
    icon: 'none'
  });
}; 