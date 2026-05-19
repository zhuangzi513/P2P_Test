// cloudfunctions/addAddress/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('event', event);
  const { userID, linkMan, mobile, address, isDefault } = event;

  if (!userID) {
    return {
      code: -1,
      data: { message: 'userID is required' }
    };
  }
  if (!linkMan || !mobile || !address) {
    return {
      code: -1,
      data: { message: 'linkMan, mobile, address are required' }
    };
  }

  const addrCollection = db.collection('addrs_info');

  try {
    // 如果新增的地址要设为默认，则先将该用户其他地址的默认取消
    if (isDefault === true || isDefault === 'true') {
      await addrCollection
        .where({ user_id: userID, isDefault: true })
        .update({
          data: { isDefault: false }
        });
    }

    const newAddress = {
      user_id: userID,
      linkMan,
      mobile,
      address,
      isDefault: (isDefault === true || isDefault === 'true'),
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    const res = await addrCollection.add({ data: newAddress });

    return {
      code: 0,
      data: {
        id: res._id,
        message: '添加成功'
      }
    };
  } catch (err) {
    console.error(err);
    return {
      code: -1,
      data: {
        message: err.message + ' addAddress failed for userID:' + userID
      }
    };
  }
};
