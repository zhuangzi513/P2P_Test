const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { userID, pageNo = 1, pageSize = 20 } = event
  const goodsCollection = db.collection('goods_info');
  
  try {
    const query = await goodsCollection.where({owner_id: userID});
    const total = query.count().total;
    const skip = (pageNo - 1) * pageSize;
    const goodsReturn = await query 
                               .skip(skip)
                               .limit(pageSize)
                               .orderBy('create_time')
                               .get();
    return {
      code: 0,
      goods: goodsReturn.data,
      total,
      pageNo,
      pageSize
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
