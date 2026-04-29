const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

async function generateNewOrderId() {
  const counterCollection = db.collection('orders_id_counter');
  const counterId = 'new_id_counter';

  try {
    await counterCollection.doc(counterId).update({
      data: { seq: _.inc(1) }
    });
  } catch (err) {
    if (err.errCode === -1 && err.errMsg.includes('document does not exist')) {
      await counterCollection.add({ data: { _id: counterId, seq: 1 } });
    } else {
      throw err;
    }
  }
  const res = await counterCollection.doc(counterId).get();
  return res.data.seq;
}

exports.main = async (event, context) => {
  const ownerID = event.ownerId;
  const bankerID= event.bankerId;
  const buyerID = event.buyerId;
  const goodsID = event.goodsId;

  if (!ownerID || !bankerID || !buyerID || !goodsID) {
    return {
      success: false,
      message: 'LACK OF IDs'
    }
  }

  const newOrderID = await generateNewOrderId();
  const ordersCollection = db.collection('orders_info');
  try {
    await ordersCollection.add({
      order_id: newOrderID,
      owner_id: ownID,
      banker_id: bankerID,
      buyer_id: buyerID,
      goods_id: goodsID,
      order_status:-1
    });
    return {
      code: 0,
      orderID: newOrderID
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
