const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

async function generateNewGoodsId() {
  const counterCollection = db.collection('id_counters');
  const counterId = 'goods_id_counter';

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
  const goodsInfo = event.goodsInfo;

  if (!ownerID || !bankerID || !goodsID) {
    return {
      success: false,
      message: 'LACK OF IDs'
    }
  }

  const newGoodsID = await generateNewGoodsId();
  const ordersCollection = db.collection('goods_info');
  try {
    await ordersCollection.add({
      goods_id: newGoodsID,
      owner_id: ownID,
      banker_id: bankerID,
      goods_info:goodsInfo
    });
    return {
      code: 0,
      goodsID: newGoodsID
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
