const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

async function generateNewGoodsId() {
  const counterCollection = db.collection('ids_info');
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

  console.log('owner:', ownerID)
  console.log('banker:', bankerID)
  console.log('goodsinfo', goodsInfo)
  if (!ownerID || !bankerID || !goodsInfo) {
    return {
      code: -1,
      message: 'LACK OF IDs or goodsInfo'
    }
  }

  const newGoodsID = await generateNewGoodsId();
  const goodsCollection = db.collection('goods_info');
  try {
    await goodsCollection.add({
      data: {
        goods_id: newGoodsID,
        owner_id: ownerID,
        banker_id: bankerID,
        goods_info: goodsInfo
      }
    });
    return {
      code: 0,
      data: {
        code: 0,
        goodsID: newGoodsID
      }
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
