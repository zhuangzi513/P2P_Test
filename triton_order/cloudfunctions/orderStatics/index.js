const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  console.log("event:", event)
  const userID = event.userID;
  const orderType = event.orderType;
  const isBanker = event.isBanker;
  const pageNo = event.pageNo || 1;
  const pageSize = 20;
  const ordersCollection = db.collection('orders_info');
  
  const skip = (pageNo - 1) * pageSize;
  try {
    let query;
    if (!isBanker) {
        if (orderType == 0) {
          query = ordersCollection.where({owner_id: userID});
	} else if (orderType == 1) {
          query = ordersCollection.where({buyer_id: userID});
	} else {
          query = ordersCollection.where({owner_id: userID});
        }
    } else {
        query = ordersCollection.where({banker_id: userID});
    }
    const countResult = await query.count();
    const total = countResult.total;

    const ordersResult = await query 
                         .skip(skip)
                         .limit(pageSize)
                         .get();
    return {
      code: 0,
      data: {
        orders: ordersResult.data,
        total,
        pageNo,
        pageSize
      },
      message: 'success' 
    };
  } catch (err) {
    return {
      code: -1,
      data: {},
      message: err.message
    }
  }
};
