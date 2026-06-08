const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV});

const db = cloud.database();
const _ = db.command;

// 玩家用户ID: "WJ" + 随机大写字母 + 4位顺序编号
async function generatePlayerUserId() {
  const counterCollection = db.collection('ids_info');
  const counterId = 'player_id_counter';

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
  const seq = res.data.seq;
  const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
  return 'WJ' + letter + String(seq).padStart(4, '0');
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const usersCollection = db.collection('users_info');
  let userRecord = await usersCollection.where({open_id : openid}).get();
  var userId;
  
  if (userRecord.data.length === 0) {
    console.log("userRecord.data.length==0")
    userId = await generatePlayerUserId();
    await usersCollection.add({
      data: {
        open_id: openid,
        user_id: userId,
        is_banker: false,
        data: {
          nick: "007",
          level: 0,
          score: 100,
          user_id: userId,
          created_at: new Date()
        }
      }
    });
  } else {
    console.log("userRecord.data", userRecord.data[0])
    userId = userRecord.data[0].user_id;
  }
  
  console.log('userId', userId);
  return { code: 0, data: { userID : userId }};
};
