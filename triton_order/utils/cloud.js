//wx.cloud.init({ env: 'ramotest-d6gbke3913ce78dfa', traceUser: true});

async function callCloudFunction(name, data) {
  try {
    const res = await wx.cloud.callFunction({ name, data });
    if (res.result && res.result.code === 0) {
      return res.result.data;
    } else {
      throw res.result || { message: '未知错误' };
    }
  } catch (err) {
    throw err;
  }
}

module.exports = { callCloudFunction: callCloudFunction }
