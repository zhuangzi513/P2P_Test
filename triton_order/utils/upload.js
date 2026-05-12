/**
 * 文件上传工具函数
 * 使用 wx.cloud.uploadFile 上传到云存储，然后获取访问链接
 */

/**
 * 上传单个文件
 * @param {string} filePath - 本地临时文件路径
 * @param {string} type - 文件类型 'image' 或 'video'
 * @param {object} cloudFunc - 云函数调用对象（如 CLOUDFUNC）
 * @returns {Promise<string>} - 返回文件访问URL
 */
function uploadFile(filePath, type, cloudFunc) {
  return new Promise(async (resolve, reject) => {
    try {
      // 生成云存储路径
      const cloudPath = `uploads/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${type === 'video' ? 'mp4' : 'jpg'}`;
      
      // 直接使用 wx.cloud.uploadFile 上传到云存储
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
      });
      
      console.log('uploadResult:', uploadResult);
      const cloudFileID = uploadResult.fileID;
      
      // 调用云函数获取访问链接
      const res = await cloudFunc.callCloudFunction('uploadFile', {
        cloudFileID: cloudFileID
      });
      
      if (res && res.fileUrl) {
        resolve(res.fileUrl);
      } else {
        reject('FAILED TO GET FILE URL');
      }
    } catch (err) {
      console.error('uploadFile error:', err);
      reject(err.message || 'FAILED TO UPLOAD file');
    }
  });
}

/**
 * 上传多个文件（支持并发）
 * @param {string[]} filePaths - 本地临时文件路径数组
 * @param {string} type - 文件类型 'image' 或 'video'
 * @param {object} cloudFunc - 云函数调用对象（如 CLOUDFUNC）
 * @param {number} concurrency - 并发数量，默认3
 * @returns {Promise<string[]>} - 返回文件访问URL数组
 */
function uploadFiles(filePaths, type, cloudFunc, concurrency = 3) {
  let index = 0;
  const results = new Array(filePaths.length);
  
  const uploadNext = () => {
    if (index >= filePaths.length) return Promise.resolve();
    const i = index++;
    return uploadFile(filePaths[i], type, cloudFunc)
      .then(url => {
        results[i] = url;
        return uploadNext();
      });
  };
  
  const tasks = [];
  for (let i = 0; i < concurrency; i++) {
    tasks.push(uploadNext());
  }
  
  return Promise.all(tasks).then(() => results);
}

module.exports = {
  uploadFile,
  uploadFiles
};
