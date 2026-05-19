// cloudfunctions/queryAddress/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('event', event);
  const userID = event.userID;

  if (!userID) {
    return {
      code: -1,
      data: {
        message: 'userID is required',
        result: []
      }
    };
  }

  const addrCollection = db.collection('addrs_info');

  try {
    const { data } = await addrCollection
      .where({ user_id: userID })
      .orderBy('isDefault', 'desc')
      .orderBy('updateTime', 'desc')
      .get();

    return {
      code: 0,
      data: {
        result: data,
        message: 'success'
      }
    };
  } catch (err) {
    console.error(err);
    return {
      code: -1,
      data: {
        message: err.message + ' queryAddress failed for userID:' + userID,
        result: []
      }
    };
  }
};
