const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;


exports.main = async (event, context) => {
  const { goodsID, goodsInfo, field, value } = event

  if (!goodsID) {
    return { success: false, message: 'LACK OF goodsID' }
  }

  try {
    const record = await db.collection('goods_info').where({goods_id: Number(goodsID)}).get();
    if (!record.data || record.data.length === 0) {
      return { success: false, message: 'GOODS NOT FOUND' }
    }
    const docId = record.data[0]._id;

    // 更新 goods_info 子对象（合并更新）
    if (goodsInfo && typeof goodsInfo === 'object') {
      const existing = record.data[0].goods_info || {};
      const merged = { ...existing, ...goodsInfo };
      await db.collection('goods_info').doc(docId).update({
        data: { goods_info: merged }
      });
      return { success: true, message: 'GOODS INFO UPDATED' }
    }

    // 单字段更新（向后兼容）
    if (field !== undefined && value !== undefined) {
      const updateData = {};
      updateData[field] = value;
      await db.collection('goods_info').doc(docId).update({ data: updateData });
      return { success: true, message: `${field} UPDATED` }
    }

    return { success: false, message: 'NO UPDATE PARAM' }
  } catch (err) {
    return { success: false, message: err.message }
  }
};
