const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { cloudFileID } = event;
  
  console.log('event:', event);
  console.log('cloudFileID:', cloudFileID);
  
  if (!cloudFileID) {
    return { success: false, message: 'no cloudFileID' };
  }

  try {
    // 获取云文件的访问链接
    const fileUrlRes = await cloud.getTempFileURL({
      fileList: [cloudFileID]
    });
    
    console.log('fileUrlRes:', fileUrlRes);
    const fileInfo = fileUrlRes.fileList[0];
    
    if (fileInfo.errCode) {
      return { success: false, message: fileInfo.errMsg };
    }
    
    return {
      success: true,
      fileID: cloudFileID,
      fileUrl: fileInfo.tempFileURL
    };
  } catch (err) {
    console.error('uploadFile error:', err);
    return { success: false, message: err.message, errCode: err.errCode };
  }
};
