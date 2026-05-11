async function callCloudFunction(name, data) {
  try {
    const res = await wx.cloud.callFunction({ name, data });
    console.log('name:', name)
    console.log('res:', res)
    const result = res.result;
    if (result) {
      // 如果有 code 字段，按 code 判断
      if (result.code !== undefined) {
        if (result.code === 0) {
          // 优先返回 data 字段，如果没有 data 则返回整个 result（去掉 code）
          if (result.data !== undefined) {
            return result.data;
          }
          // 没有 data 字段，返回去掉 code 的 result
          const { code, ...rest } = result;
          return rest;
        } else {
          throw result;
        }
      }
      // 没有 code 字段（如 uploadFile 用 success），按 success 判断
      if (result.success !== undefined) {
        if (result.success) {
          const { success, ...rest } = result;
          return rest;
        } else {
          throw result;
        }
      }
      // 既没有 code 也没有 success，直接返回 result
      return result;
    }
    throw { message: '未知错误' };
  } catch (err) {
    throw err;
  }
}

module.exports = { callCloudFunction: callCloudFunction }
