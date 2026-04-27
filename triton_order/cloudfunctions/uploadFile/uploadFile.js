const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const { fileID } = event;
  if (!fileID) {
    return { success: false, message: 'no fileID' };
  }

  try {
    await cloud.openapi.cloudbase.updateFileACL({
      fileidList: [fileID],
      acl: 'public-read',
    });

    const fileUrlRes = await cloud.getTempFileURL({
      fileList: [fileID]
    });
    const tempFileURL = fileUrlRes.fileList[0].tempFileURL;

    return {
      success: true,
      fileID: fileID,
      fileUrl: tempFileURL
    };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
};
