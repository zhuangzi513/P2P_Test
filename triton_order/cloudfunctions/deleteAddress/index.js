// cloudfunctions/deleteAddress/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const userID = event.userID;
  const id  = event.id;
  console.log('userID:' + userID);
  console.log('id:' + id);

  if (!userID) {
    return {
      code: -1,
      data: { message: 'userID is required' }
    };
  }
  if (!id) {
    return {
      code: -1,
      data: { message: 'address id is required' }
    };
  }

  const addrCollection = db.collection('addrs_info');

  try {
    // 获取待删除地址信息
    const addrRes = await addrCollection.where({ _id: id, user_id: userID }).get();
    if (!addrRes.data || addrRes.data.length === 0) {
      return {
        code: -1,
        data: { message: 'Address not found or permission denied' }
      };
    }

    const isDefault = addrRes.data[0].isDefault;

    // 删除地址
    await addrCollection.doc(id).remove();

    // 如果删除的是默认地址，则找一条最新地址设为默认
    if (isDefault) {
      const remainList = await addrCollection
        .where({ user_id: userID })
        .orderBy('updateTime', 'desc')
        .limit(1)
        .get();

      if (remainList.data.length > 0) {
        await addrCollection.doc(remainList.data[0]._id).update({
          data: { isDefault: true }
        });
      }
    }

    return {
      code: 0,
      data: { message: '删除成功' }
    };
  } catch (err) {
    console.error(err);
    return {
      code: -1,
      data: {
        message: err.message + ' deleteAddress failed for userID:' + userID
      }
    };
  }
};
