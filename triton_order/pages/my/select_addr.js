const CLOUDFUNC = require('../../utils/cloud.js')

Page({
  data: {
    page: 1,
    addressList: null,          // 地址列表
    showForm: false,            // 是否显示表单
    selectMode: false,
    isEdit: false,              // 是否为编辑模式
    editId: null,               // 编辑时的地址ID
    formData: {
      linkMan: '',
      mobile: '',
      address: '',
      isDefault: false
    },
    submitting: false           // 提交状态
  },

  // 显示新增表单
  openAddInline() {
    this.setData({
      showForm: true,
      isEdit: false,
      editId: null,
      formData: {
        linkMan: '',
        mobile: '',
        address: '',
        isDefault: false
      }
    });
  },

  // 显示编辑表单（内联）
  openEditInline(e) {
    const id = e.currentTarget.dataset.id;
    const address = this.data.addressList.find(item => item._id == id);
    if (address) {
      this.setData({
        showForm: true,
        isEdit: true,
        editId: id,
        formData: {
          linkMan: address.linkMan,
          mobile: address.mobile,
          address: address.address,
          isDefault: address.isDefault || false
        }
      });
    }
  },

  // 隐藏表单
  hideForm() {
    this.setData({ showForm: false });
  },

  // 表单字段变化
  onFieldChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail
    });
  },

  // 默认地址开关变化
  onDefaultChange(e) {
    this.setData({
      'formData.isDefault': e.detail
    });
  },

  // 提交地址（新增或编辑）
  async submitAddress() {
    const { linkMan, mobile, address, isDefault } = this.data.formData;
    if (!linkMan || !mobile || !address) {
      wx.showToast({ title: 'Please fill in all fields', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(mobile)) {
      wx.showToast({ title: 'Invalid phone number', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: 'Saving...' });

    try {
      let res;
      if (this.data.isEdit) {
        // 编辑地址
        res = await CLOUDFUNC.callCloudFunction('updateAddress', {
          userID: wx.getStorageSync('userID'),
          id: this.data.editId,
          linkMan,
          mobile,
          address,
          isDefault: isDefault ? 'true' : 'false'
        });
      } else {
        // 新增地址
        res = await CLOUDFUNC.callCloudFunction('addAddress', {
          userID: wx.getStorageSync('userID'),
          linkMan,
          mobile,
          address,
          isDefault: isDefault ? 'true' : 'false'
        });
      }

      wx.hideLoading();
      this.setData({ submitting: false });

      if (res.code === 0) {
        wx.showToast({ title: this.data.isEdit ? 'Updated' : 'Added', icon: 'success' });
        this.hideForm();                 // 关闭表单
        this.initShippingAddress();      // 刷新列表
      } else {
        wx.showToast({ title: res.msg || 'Failed', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: 'Network error', icon: 'none' });
    }
  },

  // 长按地址 - 设为默认地址
  onAddressLongPress(e) {
    const id = e.currentTarget.dataset.id;
    const address = this.data.addressList.find(item => item._id == id);
    if (!address) return;
    wx.showModal({
      title: '设为默认地址',
      content: '确定将「' + address.linkMan + ' ' + address.address + '」设为默认地址吗？',
      success: (res) => {
        if (res.confirm) {
          CLOUDFUNC.callCloudFunction('updateAddress', {
            userID: wx.getStorageSync('userID'),
            id: id,
            isDefault: 'true'
          }).then(() => {
            wx.showToast({ title: '已设为默认', icon: 'success' });
            this.initShippingAddress();
          });
        }
      }
    });
  },

  // 原有的选择地址（设为默认）
  onAddressTap(e) {
   const id = e.currentTarget.dataset.id;
    const address = this.data.addressList.find(item => item._id == id);
    if (this.data.selectMode) {
      // 选择模式：将选中的地址返回上一页
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.emit('selectAddress', address);
      wx.navigateBack();
    } else {
      // 原有逻辑：设为默认地址
      CLOUDFUNC.callCloudFunction('updateAddress', {
        userID: wx.getStorageSync('userID'),
        id: id,
        isDefault: 'true'
      }).then(res => {
        wx.navigateBack({});
      });
    }
  },

  onLoad(options) {
    if (options.selectMode === 'true') {
      this.setData({ selectMode: true });
    }
  },

  onShow: function() {
    this.initShippingAddress();
  },

  async initShippingAddress() {
    wx.showLoading({ title: '' });
    const res = await CLOUDFUNC.callCloudFunction('queryAddress', {
      userID: wx.getStorageSync('userID')
    });
    console.log(res)
    wx.hideLoading();
    if (res.code == 0) {
      this.setData({
        addressList: res.result
      });
    } else if (res.code == 700) {
      this.setData({
        addressList: null
      });
    } else {
      wx.showToast({
        title: res.msg,
        icon: 'none'
      });
    }
  },

  onPullDownRefresh() {
    this.data.page = 1;
    this.initShippingAddress();
    wx.stopPullDownRefresh();
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      content: 'SURE ?',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '' });
          try {
            await CLOUDFUNC.callCloudFunction('deleteAddress', { userID: wx.getStorageSync('userID'), id: id });
            wx.hideLoading();
            wx.showToast({
              title: 'DELETED',
              icon: 'none'
            });
            this.initShippingAddress();  // 刷新列表
          } catch (err) {
            wx.hideLoading();
            wx.showToast({
              title: err.message || err.msg || '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  }
});
