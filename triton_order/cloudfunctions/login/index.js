const cloud = require('wx-server-sdk')
const jwt = require('jsonwebtoken')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database();
const _ = db.command;

// 寄售商家用户ID: "SJ" + 随机大写字母 + 3位顺序编号
async function generateBankerUserId() {
  const counterCollection = db.collection('ids_info');
  const counterId = 'banker_id_counter';

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
  return 'SJ' + letter + String(seq).padStart(3, '0');
}

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
  const openId = cloud.getWXContext().OPENID;
  const isBanker = event.isBanker;
  const inviteCode = event.inviteCode;
  const JWT_SECRET='f3a2b8c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8'
  let userId = -1;

  try {

    const db = cloud.database()
    const userCollection = db.collection('users_info')
    let userRecord
    if (!isBanker) {
      userRecord = await userCollection.where({open_id : openId, is_banker:false}).get()
    } else {
      userRecord = await userCollection.where({open_id : openId, is_banker:true}).get()
    }

    if (userRecord.data.length === 0) {
      // 寄售商家注册需要邀请码
      if (isBanker) {
        if (!inviteCode || !inviteCode.trim()) {
          return {
            code: -1,
            message: '需要邀请码才能注册寄售商家',
            data: { code: -1, message: '需要邀请码才能注册寄售商家' }
          };
        }
        // 校验邀请码
        const inviteCollection = db.collection('banker_invites');
        const inviteRecord = await inviteCollection.where({
          code: inviteCode.trim(),
          used: false
        }).get();
        if (!inviteRecord.data || inviteRecord.data.length === 0) {
          return {
            code: -1,
            message: '邀请码无效或已被使用',
            data: { code: -1, message: '邀请码无效或已被使用' }
          };
        }
        // 标记邀请码为已使用
        await inviteCollection.doc(inviteRecord.data[0]._id).update({
          data: {
            used: true,
            used_by: openId,
            used_at: new Date()
          }
        });
      }
      userId = isBanker ? await generateBankerUserId() : await generatePlayerUserId();
      await userCollection.add({
        data: {
          open_id: openId,
          user_id: userId,
	  is_banker: isBanker,
          data: {
          nick: "007",
          level: 0,
          score: 100,
          created_at: new Date()
          }
        }
      });
    } else {
      console.log('userRecord', userRecord)
      userId = userRecord.data[0].user_id;
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
        code: 0,
        token: token,
        userID: userId
      }
    }
  } catch (err) {
    console.error('Login error:', err)
    return { code: 500, message: 'server error' }
  }
}
