const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { goodsID } = event
  const goodsCollection = db.collection('goods_info');
  
  try {
    console.log('getGoodsInfo query goodsID:', goodsID, typeof goodsID);
    // 同时尝试字符串和数字类型匹配
    let goodsRecord = await goodsCollection.where({
      goods_id: Number(goodsID) || String(goodsID)
    }).get();
    console.log('goodsRecord:', JSON.stringify(goodsRecord.data));
    return {
      code: 0,
      data: {
        goodsInfo: goodsRecord.data
      }
    };
  } catch (err) {
    console.error('getGoodsInfo error:', err);
    return {
      code: -1,
      message: err.message
    }
  }
};
