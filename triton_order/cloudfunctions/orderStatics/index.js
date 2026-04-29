const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { userID, orderType = 0, orderStatus = -1, pageNo = 1, pageSize = 20 } = event
  const ordersCollection = db.collection('orders_info');
  
  try {
    const query = await ordersCollection.where({user_id: userID, order_type: orderType, order_status: orderStatus});
    const total = query.count().total;
    const skip = (pageNo - 1) * pageSize;
    const ordersReturn = await query 
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
