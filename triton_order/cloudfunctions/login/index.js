const cloud = require('wx-server-sdk')
const jwt = require('jsonwebtoken')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

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
  const openId = cloud.getWXContext().OPENID;
  const isBanker = event.isBanker;
  const JWT_SECRET='f3a2b8c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8'
  let userId = -1;

  try {

    const db = cloud.database()
    const userCollection = db.collection('users_info')
    let userRecord
    if (!isBanker) {
      userRecord = await userCollection.where({open_id : openId, is_banker:false}).get()
    else {
      userRecord = await userCollection.where({open_id : openId, is_banker:true}).get()
    }

    if (userRecord.data.length === 0) {
      userId = await generateNewUserId();
      await usersCollection.add({
        data: {
          open_id: openId,
          user_id: userId,
	  is_banker: isBanker,
          data: {
            nick: "007",
            level: 0,
            socre: 100,
            created_at: new Date()
          }
        }
      });
    }

    const token = jwt.sign(
      { user_id: userId, open_id: openId },
      JWT_SECRET,
      { expiresIn: '2d' }
    )

    return {
      code: 0,
      message: 'success',
      data: {
        token: token,
        userID: userId
      }
    }
  } catch (err) {
    console.error('Login error:', err)
    return { code: 500, message: 'server error' }
  }
}
