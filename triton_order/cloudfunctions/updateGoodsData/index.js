const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();

exports.main = async (event, context) => {
  const { goodID, ownerID, info } = event;

  if (!goodID) {
    return {
      code: -1,
      message: 'no good_id'
    };
  }
  if (!ownerID) {
    return {
      code: -1,
      message: 'no ownerID'
    };
  }
  if (!info || typeof info !== 'object') {
    return {
      code: -1,
      message: 'no good_info'
    };
  }

  const collection = db.collection('goods_info');
  try {
    const doc = await collection.where({ goods_id: goodID }).get();
    let updateResult;
    if (doc.data && doc.data.length > 0) {
      updateResult = await collection.doc(doc.data[0]._id).update({ data: info });
    } else {
      updateResult = await collection.add({
        data: {
          goods_id: goodID,
          owner_id: ownerID,
          ...info
        }
      });
    }

    if (updateResult.stats && updateResult.stats.updated === 1) {
      return {
        code: 0,
        message: 'UPDATED',
        data: { goods_id: goodID, ...info }
      };
    } else if (updateResult._id) {
      return {
        code: 0,
        message: 'CREATED',
        data: { _id: updateResult._id, goods_id: goodID, ...info }
      };
    } else {
      return {
        code: -2,
        message: 'FAILED UPDATE: NO SPECIFIED_GOOD/GOODINFO_NOT_CHANGED',
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
