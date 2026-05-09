const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const orderID = event.orderID;
  console.log('orderID :', orderID)
  const ordersCollection = db.collection('orders_info');
  
  try {
    console.log(new Date())
    let orderRecord = await ordersCollection.where({order_id:orderID}).get();
    console.log('cloud getOrderInfo :', orderRecord)
    return {
      code: 0,
      data: {
        code: 0,
        orderInfo: orderRecord.data
      }
    };
  } catch (err) {
    return {
      code: -1,
      data: {
        code: -1,
        message: err.message
      }
    }
  }
};
