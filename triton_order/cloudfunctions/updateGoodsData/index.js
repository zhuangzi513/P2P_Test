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
        message: 'UPDATED',
        data: { _id: id, ...info }
      };
    } else {
      return {
        code: -2,
        message: 'FALIED UPDATE: NO SPECIFIED_GOOD/GOODINFO_NOT_CHANGED',
        stats: updateResult.stats
      };
    }
  } catch (err) {
    console.error('FAILED UPDATE', err);
    return {
      code: -3,
      message: 'DB OP FAILED',
      error: err.message
    };
  }
};
