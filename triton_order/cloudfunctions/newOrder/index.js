const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

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
  const orderType = event.orderType;
  let bankerId = -1;
  let ownerId = -1;
  let bankerId = -1;
  let buyerId = -1;
  let goodsId = -1;

  if (orderType == 0) {
    bankerId = event.bankerID;
    if (bankerId == undefined) {
      return {
        code: -1,
        message: 'LACK OF IDs'
      }
    }
  } else if (orderType == 1) {
    ownerId = event.ownerID;
    bankerId = event.bankerID;
    buyerId = event.buyerID;
    goodsId = event.buyerID;
    if (buyerId == undefined || ownerId == undefined
	|| buyerId == undefined || goodsId == undefined) {
      return {
        code: -1,
        message: 'LACK OF IDs'
      }
    }
  }

  const newOrderId = await generateNewOrderId();
  const ordersCollection = db.collection('orders_info');
  try {
    await ordersCollection.add({
      data : {
        order_id: newOrderId,
        owner_id: ownerId,
        banker_id: bankerId,
        buyer_id: buyerId,
        goods_id: goodsId,
        order_status:-1
        order_details : {
	}
      }
    });
    return {
      code: 0,
      orderId: newOrderId
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
