const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  console.log('event', event);
  const userID = event.userID;
  const usersCollection = db.collection('users_info');
  
  try {
    let userRecord = await usersCollection.where({user_id: userID}).get();
      return {
        code: 0,
        data: {
          userInfo: userRecord.data
        }
      };
  } catch (err) {
    return {
      code: -1,
      data: {
        message: err.message + 'users_info query failed for userID:' + userID
      }
    }
  }
};
