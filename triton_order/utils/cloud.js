const callCloudFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data
    }).then(res => {
      if (res.result && res.result.code === 0) {
        resolve(res.result.data);
      } else {
        reject(res.result || { message: '未知错误' });
      }
    }).catch(err => {
      reject(err);
    });
  });
};

module.exports = { callCloudFunction };
