const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;


exports.main = async (event, context) => {
  const { goodsID, field, value } = event

  if (!goodsID || !field || value === undefined) {
    return {
      success: false,
      message: 'LACK OF goodsID/field/value'
    }
  }

  try {
    const updateData = {}
    updateData[field] = value

    await db.collection('goods_info').doc(goodsID).update({
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
