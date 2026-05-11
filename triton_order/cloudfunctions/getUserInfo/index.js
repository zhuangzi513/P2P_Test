const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  console.log('event', event);
  const userID = event.userID;

  if (!userID) {
    return {
      code: -1,
      data: {
        message: 'userID is required',
        userInfo: {}
      }
    };
  }

  const usersCollection = db.collection('users_info');
  
  try {
    let userRecord = await usersCollection.where({user_id: userID}).get();
    console.log('userRecord:', userRecord)
    if (!userRecord.data || userRecord.data.length === 0) {
      return {
        code: -1,
        data: {
          message: 'User not found',
          userInfo: {}
        }
      };
    }
    return {
      code: 0,
      data: {
        userInfo: {
          user_id: userRecord.data[0].user_id,
          ...userRecord.data[0].data
        }
      }
    };
  } catch (err) {
    return {
      code: -1,
      data: {
        message: err.message + ' users_info query failed for userID:' + userID,
        userInfo:{}
      }
    }
  }
};
