const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { goodsID } = event
  const goodsCollection = db.collection('goods_info');
  
  try {
    let goodsRecord = await goodsCollection.doc(goodsID).get();
    return {
      code: 0,
      goodsInfo: goodsRecord.data
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
