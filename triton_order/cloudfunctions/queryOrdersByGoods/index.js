const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { goodsID, pageNo, pageSize } = event;

  if (!goodsID) {
    return {
      code: -1,
      message: 'LACK OF goodsID'
    };
  }

  const skip = (pageNo || 0) * (pageSize || 50);

  console.log(goodsID,pageNo, pageSize)
  try {
    const ordersCollection = db.collection('orders_info');
    // goods_id 在 orders_info 中可能是字符串或数字，使用 _.or 同时匹配两种类型
    const queryCondition = _.or([
      { goods_id: Number(goodsID) },
      { goods_id: String(goodsID) }
    ]);

    const countResult = await ordersCollection.where(queryCondition).count();
    const total = countResult.total;

    const ordersResult = await ordersCollection
      .where(queryCondition)
      .orderBy('create_time', 'desc')
      .skip(skip)
      .limit(pageSize || 50)
      .get();

    return {
      code: 0,
      data: {
        orders: ordersResult.data,
        total
      }
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message
    };
  }
};
