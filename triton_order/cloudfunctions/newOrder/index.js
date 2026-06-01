const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

async function generateNewOrderId() {
  const counterCollection = db.collection('ids_info');
  const counterId = 'order_id_counter';

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
  let ownerId = -1;
  let bankerId = -1;
  let buyerId = -1;
  let goodsId = -1;

  if (orderType == 0) {
    bankerId = event.bankerID;
    ownerId = event.ownerID;
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
    goodsId = Number(event.goodsID);
    if (bankerId == undefined || ownerId == undefined
	|| buyerId == undefined || goodsId == undefined) {
      return {
        code: -1,
        message: 'LACK OF IDs'
      }
    }
  }

  const newOrderId = await generateNewOrderId();
  console.log('newOrderId', newOrderId)
  const ordersCollection = db.collection('orders_info');
  try {
    const addResult = await ordersCollection.add({
      data : {
        order_id: newOrderId,
        owner_id: ownerId,
        banker_id: bankerId,
        buyer_id: buyerId,
        goods_id: goodsId,
        order_type:orderType,
        order_status:-1,
        order_details : {
          time_created: new Date()
	}
      }
    });
    console.log("newOrder: ", new Date())
    return {
      code: 0,
      data : {
        code: 0,
        orderId: newOrderId
      }
    }
  } catch (err) {
    return {
      code: -1,
      data : {
        code: -1,
        message: err.message
      }
    }
  }
};
