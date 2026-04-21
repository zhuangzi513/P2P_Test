const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const collection = db.collection('goods');
const doc = await collection.doc(id).get();

exports.main = async (event, context) => {
  const { good_id, user_id, info } = event;

  if (!good_id) {
    return {
      code: -1,
      message: 'no good_id'
    };
  }
  if (!user_id) {
    return {
      code: -1,
      message: 'no user_id'
    };
  }
  if (!info || typeof info !== 'object') {
    return {
      code: -1,
      message: 'no good_info'
    };
  }
  try {
    if (doc.data) {
      updateResult = await collection.doc(id).update({ user_id: user_id, data: info });
    } else {
      updateResult = await collection.add({ data: { _id: id, ...info } });
    }

    if (updateResult.stats.updated === 1) {
      return {
        code: 0,
        message: '更新成功',
        data: { _id: id, ...info }
      };
    } else {
      return {
        code: -2,
        message: '未找到对应商品或数据无变化',
        stats: updateResult.stats
      };
    }
  } catch (err) {
    console.error('更新商品失败', err);
    return {
      code: -3,
      message: '数据库操作失败',
      error: err.message
    };
  }
};
