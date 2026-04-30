const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { orderID } = event
  const ordersCollection = db.collection('orders_info');
  
  try {
    let orderRecord = await ordersCollection.doc(orderID).get();
    return {
      code: 0,
      orderInfo: orderRecord.data
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
