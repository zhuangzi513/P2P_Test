const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

async function generateNewUserId() {
  const counterCollection = db.collection('ids_info');
  const counterId = 'user_id_counter';
  
  try {
    await counterCollection.doc(counterId).update({
      data: { seq: _.inc(1) }
    });
  } catch (err) {
    console.log(err)
    if (err.errCode === -502005 || (err.errMsg && err.errMsg.includes('does not exist'))) {
      await counterCollection.add({ data: { _id: counterId, seq: 1 } });
    } else {
      throw err;
    }
  }
  const res = await counterCollection.doc(counterId).get();
  return res.data.seq;
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const usersCollection = db.collection('users_info');
  let userRecord = await usersCollection.where({open_id : openid}).get();
  var userId;
  
  if (userRecord.data.length === 0) {
    userId = await generateNewUserId();
    await usersCollection.add({
      open_id: openid,
      user_id: userId,
      data: {
        created_at: new Date()
      }
    });
  } else {
    userId = userRecord.user_id;
  }
  
  return { code:0, data: { userID : userId }};
};
