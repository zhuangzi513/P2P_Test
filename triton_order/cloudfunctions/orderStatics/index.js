const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  console.log("event:", event)
  const { userID, orderType, isBanker, pageNo } = event
  const ordersCollection = db.collection('orders_info');
  
  const skip = (pageNo - 1) * pageSize;
  var query;
  try {
    if (!isBanker) {
        if (orderType == 0) {
          query = await ordersCollection.where({owner_id: userID});
	} else if (orderType == 1) {
          query = await ordersCollection.where({buyer_id: userID});
	}
    } else {
        query = await ordersCollection.where({saler_id: userID});
    }

    const total = query.count().total;
    ordersReturn = await query 
                         .skip(skip)
                         .limit(pageSize)
                         .orderBy('create_time')
                         .get();
    return {
      code: 0,
      orders: ordersReturn.data,
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
