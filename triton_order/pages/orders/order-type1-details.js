const CLOUDFUC = require('../../utils/cloud.js');
const ORDER_STATUS= require('../../utils/order_status.js');

Page({
    data:{
      orderId:0,
      goodId:0,
      userID:0,
      submitting: false,
      loading: true,
      updatingDisabled: true,
      orderNextStep: "",
      orderPostID0Needed: false,
      orderPostID1Needed: false,
      isOwner: false,
      isSaler: false,
      isBuyer: false,
      canSee: false,
      goodInfo: {
      },
      orderDetail: {
      }
    },
    onLoad:function(e){
      this.setData({
        orderId: e.id,
        userID: wx.getStorageSync('userID'),
      })
    },
    onShow() {
      this.orderDetail().then(res => {
           this.updateButtonStatus()
      });
    },
    async orderDetail() {
      if (!this.data.orderId) {
        return
      }
      wx.showLoading({
        title: '',
      })
      const res = await CLOUDFUNC.callCloudFunction('getOrderInfo', {orderID:this.data.orderId})
      wx.hideLoading()
      if (res.code != 0) {
        wx.showModal({
          content: res.msg,
          showCancel: false
        })
        return
      }
      this.setData({
        orderDetail: res.orderInfo,
      });
      if (!this.data.orderDetail.bankerID.strim()) {
          wx.showToast({ title: 'empty bankerID:', icon: 'none' });
      }
      let _isOwner = (userID == this.data.orderDetail.owner_id);
      let _isSaler = (userID == this.data.orderDetail.banker_id);
      let _isBuyer = (userID == this.data.orderDetail.buyer_id);
      let _canSee  = (_isOwner || _isSaler || _isBuyer);
      this.setData({
	      orderNextStep: ORDER_STATUS.statusMap1[this.data.orderDetail.order_status+1],
	      isOwner: _isOwner,
	      isSaler: _isSaler,
	      isBuyer: _isBuyer, 
	      canSee : _canSee
      });
    },
    updateButtonStatus() {
      let userId = this.data.userID; 
      let opEnabled = false;
      let isCanceler = (userId == this.data.orderDetail.canceler_id);
      curOrderStatus = this.data.orderDetail.order_status;
      if (curOrderStatus == -1) {
        //recver firstly see, and then confirm
        opEnabled = this.data.isBuyer;
      } else if (curOrderStatus == 0) {
        //owner agree
        opEnabled = this.data.isOwner;
      } else if (curOrderStatus == 1) {
        //sender can send it to  recver
        opEnabled = this.data.isSaler;
        orderPostID0Needed = true;
      } else if (curOrderStatus >=2 && curOrderStatus < 8) {
        //recver got it, and then sell it, and pay to sender
        opEnabled = this.data.isBuyer;
      } else if (curOrderStatus == 8) {
        //sender confirm got payed
        opEnabled = this.data.isSaler;
      } else if (curOrderStatus == 9) {
        //done
        opEnabled = false;
      } else if (curOrderStatus == 10) {
        //any time, cancel should be confirmed by eachother
        opEnabled = !this.data.isCanceler && (this.data.isSaler || this.data.isBuyer);
      } else if (curOrderStatus == 10) {
        opEnabled = this.data.isBuyer;
        orderPostID1Needed = true;
      } else if (curOrderStatus == 11) {
        opEnabled = this.data.isSaler;
      } else {
        opEnabled = false;
      }
      this.data.updatingDisabled = opEnabled;
    },
    onPriceInput(e) {
      if (this.data.isBuyer) {
        this.setData({ 'goodInfo.price': e.detail.value });
      }
    },
    onSenderAddrInput(e)  { 
      if (this.data.isSaler) {
        this.setData({ 'orderDetail.senderAddr': e.detail.value });
      }
    },
    onRecverAddrInput(e)  {
      if (this.data.isBuyer) {
        this.setData({ 'orderDetail.recverAddr': e.detail.value });
      }
    },
    onPostIDInput(e)  {
      if (this.data.orderPostID0Needed && this.data.isSaler) {
        this.setData({ 'orderDetail.postID0': e.detail.value });
      } else if (this.data.orderPostID1Needed && this.data.isBuyer) {
        this.setData({ 'orderDetail.postID1': e.detail.value });
      }
    },
    async updateOrderData() {
      try {
        const res = await CLOUDFUNC.callCloudFunction('updateOrderInfo',
                {orderID: this.data.orderDetail.order_id, orderDetail: this.data.orderDetail});
        if (res.code != 0) {
          wx.showToast({ title: res.message || 'FAIL TO UPDATE', icon: 'none' });
        }
      } catch (err) {
        wx.showToast({ title: 'INTERNET ERROR', icon: 'none' });
        console.error(err);
      }
    },
    cancelOrder()  {
      this.data.orderDetail.order_status = ORDER_STATUS.ORDERSTATUS_ENUM1.CANCELLED; 
      updateOrderData();
    },
    nextStep()  {
      if (canSee) {
        this.data.orderDetail.order_status = this.data.orderDetail.order_status + 1;
        updateOrderData();
      }
    },
    previewImage(e) {
      const urls = this.data.imageList.map(i => i.url);
      wx.previewImage({ current: e.currentTarget.dataset.url, urls });
    },

    async addImage() {
      const remain = 9 - this.data.goodInfo.imageListLen;
      if (remain <= 0) return wx.showToast({ title: 'MAX 9', icon: 'none' });
      const res = await wx.chooseMedia({ count: remain, mediaType: ['image'], sizeType: ['compressed'] });
      wx.showLoading({ title: 'uploading...' });
      try {
        const urls = await this.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'image');
        this.setData({ imageList: [...this.data.goodInfo.imageList, ...urls.map(url => ({ url }))] });
        wx.hideLoading();
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: 'FAILED to upload', icon: 'none' });
      }
    },

    deleteImage(e) {
      //const list = [...this.data.imageList];
      //list.splice(e.currentTarget.dataset.index, 1);
      //this.setData({ goodInfo.imageList: list });
    },

    async uploadFiles(filePaths, type) {
      const concurrency = 3;
      let index = 0;
      const results = new Array(filePaths.length);
      const uploadNext = () => {
        if (index >= filePaths.length) return Promise.resolve();
        const i = index++;
        return this.uploadFile(filePaths[i], type)
          .then(url => {
            results[i] = url;
            return uploadNext();
          });
      };
      const tasks = [];
      for (let i = 0; i < Math.min(concurrency, filePaths.length); i++) {
        tasks.push(uploadNext());
      }
      return Promise.all(tasks).then(() => results);
    },

    uploadFile(filePath, type) {
      return new Promise((resolve, reject) => {
        CLOUDFUNC.callCloudFunction('uploadFile', {path:filePath}).then(res => {
          if (res.code === 0 && res.data && res.data.url) {
            resolve(res.data.url);
          } else {
            reject(res.message || 'FAILED TO UPLOAD file');
          }
        })

      });
    }
})
