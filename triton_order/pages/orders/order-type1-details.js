const { callCloudFunction } = require('../../utils/cloud.js');

Page({
    data:{
      orderId:0,
      goodId:0,
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
      enum ORDERSTATUS{
	AGREED,
        CONFIRM,
        PAYED,
        SENDTORECVER,
        RECVED0,
        DONE,
        CANCELLED,
        BACKING,
        BACKED,
        CLOSE
      },
      const statusMapType1 = [
	'AGREED',
        'CONFIRM',
        'PAYED',
        'SENDTORECVER',
        'RECVED0',
        'DONE',
        'CANCELLED',
        'BACKING',
        'BACKED',
        'CLOSED'
      ],
      goodInfo: {
        goodID: '',
        color: '',
	sizeX: '',
	sizeY: '',
	sizeZ: '',
	price: '',
	description: '',
	imageListLen,
	videoListLen,
        imageList: [],
        videoList: []
      },
      orderDetail: {
	orderID: '',
	orderType: '',
	goodID:  '',
	time:  '',
	salerID:  '',
	buyerID:  '',
	senderAddr:  '',
	recverAddr:  '',
        postID0: '',
        postID1: '',
	orderStatus:  '',
	orderStatusStr:  ''
      }
    },
    onLoad:function(e){
      this.setData({
        orderId: e.id,
      })
      await orderDetail();
    },
    onShow() {
      this.orderDetail().then(res) {
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
      const res = await callCloudFunction('orderDetail', {orderID:this.data.orderId})
      wx.hideLoading()
      if (res.code != 0) {
        wx.showModal({
          content: res.msg,
          showCancel: false
        })
        return
      }
      if (res.data.orderLogisticsShippers) {
        res.data.orderLogisticsShippers.forEach(ele => {
          if (ele.traces) {
            ele.tracesArray = JSON.parse (ele.traces)
            if (ele.tracesArray && ele.tracesArray.length > 0) {
              ele.tracesLast = ele.tracesArray[ele.tracesArray.length - 1].AcceptStation + '\n' + ele.tracesArray[ele.tracesArray.length - 1].AcceptTime
            }
          }
        })
      }
      this.setData({
        orderDetail: res.data,
      });
      if (!this.data.orderDetail.salerID.strim()) {
          wx.showToast({ title: 'empty salerID:', icon: 'none' });
      }
      canSee: false,
      _isOwner = (userId == this.data.orderDetail.ownerID);
      _isSaler = (userId == this.data.orderDetail.salerID);
      _isBuyer = (userId == this.data.orderDetail.buyerID);
      _canSee  = (_isOwner || _isSaler || _isBuyer);
      this.setData({
	      orderNextStep: this.data.statusMapType1[this.data.orderDetail.orderStatus+1],
	      isOwner: _isOwner,
	      isSaler: _isSaler,
	      isBuyer: _isBuyer, 
	      canSee : _canSee
      });
    },
    updateButtonStatus() {
      userId = wx.getStorageSync('userID');
      opEnabled = false;
      isCanceler = (userId == this.data.orderDetail.cancelerID);
      curOrderStatus = this.data.orderDetail.orderStatus;
      if (curOrderStatus == -1) {
        //recver firstly see, and then confirm
        opEnabled = isBuyer;
      } else if (curOrderStatus == 0) {
        //owner agree
        opEnabled = isOwner;
      } else if (curOrderStatus == 1) {
        //sender can send it to  recver
        opEnabled = isSaler;
        orderPostID0Needed = true,
      } else if (curOrderStatus >=2 && curOrderStatus < 8) {
        //recver got it, and then sell it, and pay to sender
        opEnabled = isBuyer;
      } else if (curOrderStatus == 8) {
        //sender confirm got payed
        opEnabled = isSaler;
      } else if (curOrderStatus == 9) {
        //done
        opEnabled = false;
      } else if (curOrderStatus == 10) {
        //any time, cancel should be confirmed by eachother
        opEnabled = !isCanceler && (isSaler || isBuyer);
      } else if (curOrderStatus == 10) {
        opEnabled = isBuyer;
        orderPostID1Needed = true,
      } else if (curOrderStatus == 11) {
        opEnabled = isSaler;
      } else {
        opEnabled = false;
      }
      this.data.updatingDisabled = opEnabled;
    },
    onPriceInput(e) {
      if (isBuyer) {
        this.setData({ goodInfo.price: e.detail.value });
      }
    },
    onSenderAddrInput(e)  { 
      if (isSaler) {
        this.setData({ orderDetail.senderAddr: e.detail.value });
      }
    },
    onRecverAddrInput(e)  {
      if (isBuyer) {
        this.setData({ orderDetail.recverAddr: e.detail.value });
      }
    },
    onPostIDInput(e)  {
      if (orderPostID0Needed && isSaler) {
        this.setData({ orderDetail.postID0: e.detail.value });
      } else if (orderPostID1Needed && isBuyer) {
        this.setData({ orderDetail.postID1: e.detail.value });
      }
    },
    async updateOrderData() {
      try {
        const res = await callCloudFunction('updateOrderData',
                orderID: this.data.orderDetail.orderID,
          	orderDetail: this.data.orderDetail
                });
        if (res.code != 0) {
          wx.showToast({ title: res.message || 'FAIL TO UPDATE', icon: 'none' });
        }
      } catch (err) {
        wx.showToast({ title: 'INTERNET ERROR', icon: 'none' });
        console.error(err);
      }
    },
    cancelOrder()  {
      this.data.orderDetail.orderStatus = ORDERSTATUS.CANCELLED; 
      updateOrderData();
    },
    nextStep()  {
      if (canSee) {
        this.data.orderDetail.orderStatus = this.data.orderDetail.orderStatus + 1;
        updateOrderData();
      }
    },
    previewImage(e) {
      const urls = this.data.imageList.map(i => i.url);
      wx.previewImage({ current: e.currentTarget.dataset.url, urls });
    },

    addImage() {
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
      const list = [...this.data.imageList];
      list.splice(e.currentTarget.dataset.index, 1);
      this.setData({ goodInfo.imageList: list });
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
        callCloudFunction('uploadFile', {path:filePath}).then(res => {
          if (res.code === 0 && res.data && res.data.url) {
            resolve(res.data.url);
          } else {
            reject(res.message || 'FAILED TO UPLOAD file');
          }
        })

      });
    }
})
