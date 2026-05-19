// cloudfunctions/updateAddress/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  console.log('event', event);
  const { userID, id, linkMan, mobile, address, isDefault } = event;

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
    // 检查地址是否存在且属于该用户
    const existRes = await addrCollection.where({ _id: id, user_id: userID }).get();
    if (!existRes.data || existRes.data.length === 0) {
      return {
        code: -1,
        data: { message: 'Address not found or permission denied' }
      };
    }

    const updateData = {};
    if (linkMan !== undefined) updateData.linkMan = linkMan;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (address !== undefined) updateData.address = address;
    if (isDefault !== undefined) updateData.isDefault = (isDefault === true || isDefault === 'true');
    updateData.updateTime = db.serverDate();

    // 如果要将当前地址设为默认，则先把其他默认地址取消
    if (updateData.isDefault === true) {
      await addrCollection
        .where({ user_id: userID, isDefault: true, _id: _.neq(id) })
        .update({
          data: { isDefault: false }
        });
    }

    await addrCollection.doc(id).update({ data: updateData });

    return {
      code: 0,
      data: { message: '更新成功' }
    };
  } catch (err) {
    console.error(err);
    return {
      code: -1,
      data: {
        message: err.message + ' updateAddress failed for userID:' + userID
      }
    };
  }
};
