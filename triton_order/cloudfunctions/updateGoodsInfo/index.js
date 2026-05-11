const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

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
    // 支持整体更新 goods_info 对象
    if (typeof value === 'object' && value !== null) {
      const record = await db.collection('goods_info').where({goods_id: Number(goodsID)}).get();
      if (record.data && record.data.length > 0) {
        await db.collection('goods_info').doc(record.data[0]._id).update({
          data: value
        });
        return {
          success: true,
          message: 'GOODS INFO UPDATED'
        }
      } else {
        return {
          success: false,
          message: 'GOODS NOT FOUND'
        }
      }
    }

    // 支持单字段更新
    const updateData = {}
    updateData[field] = value

    await db.collection('goods_info').where({goods_id: Number(goodsID)}).update({
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
