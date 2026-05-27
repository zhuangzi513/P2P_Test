const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const userID = event.userID;
  const bankerID = event.bankerID;
  const pageNo = 1;
  const pageSize = 20; 
  const goodsCollection = db.collection('goods_info');
  
  try {
    let query;
    if (bankerID) {
      query = goodsCollection.where({banker_id: Number(bankerID)});
    } else if (userID) {
      query = goodsCollection.where({owner_id: Number(userID)});
    } else {
      query = goodsCollection;
    }
    console.log('userID', userID, 'bankerID', bankerID)
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
