const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;


exports.main = async (event, context) => {
  const { userID, field, value, userDetail } = event

  if (!userID) {
    return {
      code: -1,
      message: 'LACK OF userID'
    }
  }

  try {
    const userRecord = await db.collection('users_info').where({ user_id: userID }).get();
    if (!userRecord.data || userRecord.data.length === 0) {
      return {
        code: -1,
        message: 'User not found'
      }
    }

    // 支持整体更新 userDetail
    if (userDetail) {
      await db.collection('users_info').doc(userRecord.data[0]._id).update({
        data: userDetail
      })
      return {
        code: 0,
        message: 'USER UPDATED'
      }
    }

    // 支持单字段更新
    if (!field || value === undefined) {
      return {
        code: -1,
        message: 'LACK OF field/value'
      }
    }

    const updateData = {}
    updateData[field] = value

    await db.collection('users_info').doc(userRecord.data[0]._id).update({
      data: updateData
    })

    return {
      code: 0,
      message: `${field} UPDATED`
    }
  } catch (err) {
    return {
      code: -1,
      message: err.message
    }
  }
};
