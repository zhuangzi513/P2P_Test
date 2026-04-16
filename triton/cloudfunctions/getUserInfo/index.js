const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

async function generateNewUserId() {
  const counterCollection = db.collection('counter');
  const counterId = 'user_id_counter';
  
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
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const usersCollection = db.collection('users');
  let userRecord = await usersCollection.where({ openid }).get();
  let userId;
  
  if (userRecord.data.length === 0) {
    userId = await generateNewUserId();
    await usersCollection.add({
      data: {
        openid: openid,
        user_id: userId,
        created_at: new Date()
      }
    });
  } else {
    userId = userRecord.data[0].user_id;
  }
  
  return {
    userId: userId,
    openid: openid
  };
};
