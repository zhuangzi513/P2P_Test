const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  console.log("event:", event)
  const userID = event.userID;
  const orderType = event.orderType;
  const isBanker = event.isBanker;
  const pageNo = event.pageNo;
  const pageSize = 20;
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
        query = await ordersCollection.where({banker_id: userID});
    }
    const result = query.get();
    console.log('orderStatics:', result);

    const total = query.count().total;
    ordersReturn = await query 
                         .skip(skip)
                         .limit(pageSize)
                         .get();
    return {
      code: 0,
      data: {
        code: 0,
        orders: ordersReturn.data,
        total,
        pageNo,
        pageSize
      },
      message: 'success' 

    };
  } catch (err) {
    return {
      code: -1,
      data: {
        code: -1
      },
      message: err.message
    }
  }
};
