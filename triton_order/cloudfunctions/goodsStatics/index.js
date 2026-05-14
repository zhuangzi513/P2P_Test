const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { userID, pageNo = 1, pageSize = 20 } = event
  const goodsCollection = db.collection('goods_info');
  
  try {
    let query;
    if (!userID) {
      query = goodsCollection;
    } else {
      query = goodsCollection.where({owner_id: Number(userID)});
    }
    console.log('userID', userID)
    const countResult = await query.count();
    const total = countResult.total;
    const skip = (pageNo - 1) * pageSize;
    const goodsReturn = await query 
                               .skip(skip)
                               .limit(pageSize)
                               .get();
    return {
      code: 0,
      data : {
        code: 0,
        goods: goodsReturn.data,
        total,
        pageNo,
        pageSize
      }
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
