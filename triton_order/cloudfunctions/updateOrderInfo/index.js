const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;


exports.main = async (event, context) => {
  const orderId = event.orderID;
  const field = event.field;
  const value = event.value;
  const orderDetail = event.orderDetail;

  console.log('event:',event)
  if (!orderId) {
    return {
      success: false,
      message: 'LACK OF orderID'
    }
  }

  try {
    if (orderDetail) {
      const updateData = orderDetail;
      console.log('updateData', updateData)
      const record = await db.collection('orders_info').where({order_id: orderId}).get();
      if (record.data && record.data.length > 0) {
        await db.collection('orders_info').where({order_id: orderId}).update({
          data: updateData
        });
        return {
          success: true,
          message: 'ORDER UPDATED'
        }
      } else {
        return {
          success: false,
          message: 'ORDER NOT FOUND'
        }
      }
    }

    // 支持单字段更新
    if (!field || value === undefined) {
      return {
        success: false,
        message: 'LACK OF field/value'
      }
    }

    const updateData = {}
    updateData[field] = value

    await db.collection('orders_info').where({order_id:orderId}).update({
      data: updateData
    })

    return {
      success: true,
      message: `${field} UPDATED`
    }
  } catch (err) {
    return {
      success: false,
      message: err.message
    }
  }
};
