const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;


exports.main = async (event, context) => {
  const { orderID, field, value, orderDetail } = event

  if (!orderID) {
    return {
      success: false,
      message: 'LACK OF orderID'
    }
  }

  try {
    // 支持整体更新 orderDetail 对象
    if (orderDetail) {
      // 移除 _id 字段，防止更新时报错
      const { _id, ...updateData } = orderDetail;
      const record = await db.collection('orders_info').where({order_id: orderID}).get();
      if (record.data && record.data.length > 0) {
        await db.collection('orders_info').doc(record.data[0]._id).update({
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

    await db.collection('orders_info').where({order_id:orderID}).update({
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
