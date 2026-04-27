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
      senderAddrNeeded: false,
      recverAddrNeeded: false,
      isOwner: false,
      isSaler: false,
      isBuyer: false,
      canSee: false,
      enum ORDERSTATUS{
	INIT,
        CONFRIM,
        SEND0,
        RECVED0,
        ONSALE,
        HITTED,
        SELLED,
        PAYED,
        DONE,
        CANCELLED,
        SEND1,
        RECVED1,
        CLOSE
      },
      const statusMapType0 = [
	      'Initialization',
              'Confirm',
              'SendToSaler',
              'ConfirmRecived',
              'Exhibition',
              'Hitted',
              'Selled',
              'Payed',
              'Done',
              'Canceled',
              'Backing',
              'Backed',
              'Closed'
      ],
      goodInfo: {
        goodID: '',
        ownerID: '',
        bankID: '',
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
	ownerID:  '',
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
      })
      _isOwner = (userId == this.data.orderDetail.ownerID);
      _isSaler = (userId == this.data.orderDetail.salerID);
      _isBuyer = (userId == this.data.orderDetail.buyerID);
      _canSee  = (_isOwner || _isSaler || _isBuyer);
      this.setData({
              orderNextStep: this.data.statusMapType0[this.data.orderDetail.orderStatus+1],
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
        opEnabled = isOwner;
      } else if (curOrderStatus == 0) {
        opEnabled = isSaler;
        recverAddrNeeded = true;
      } else if (curOrderStatus == 1) {
        //sender can send it to  recver
        opEnabled = isOwner;
        senderAddrNeeded = true;
        orderPostID0Needed = true,
      } else if (curOrderStatus >=2 && curOrderStatus < 8) {
        //recver got it, and then sell it, and pay to sender
        opEnabled = isSaler;
      } else if (curOrderStatus == 8) {
        //sender confirm got payed
        opEnabled = isOwner;
      } else if (curOrderStatus == 9) {
        //done
        opEnabled = false;
      } else if (curOrderStatus == 10) {
        //any time, cancel should be confirmed by eachother
        opEnabled = !isCanceler;
      } else if (curOrderStatus == 10) {
        opEnabled = isSaler;
        orderPostID1Needed = true,
      } else if (curOrderStatus == 11) {
        opEnabled = isOwner;
      }
      this.data.updatingDisabled = opEnabled;
    },
    onColorInput(e) { this.setData({ goodInfo.color: e.detail.value }); },
    onSizeInputX(e) { this.setData({ goodInfo.sizeX: e.detail.value }); },
    onSizeInputY(e) { this.setData({ goodInfo.sizeY: e.detail.value }); },
    onSizeInputZ(e) { this.setData({ goodInfo.sizeZ: e.detail.value }); },
    onPriceInput(e) { this.setData({ goodInfo.price: e.detail.value }); },
    onDescInput(e)  { this.setData({ goodInfo.description: e.detail.value }); },
    onSenderAddrInput(e)  { 
      this.setData({ orderDetail.senderAddr: e.detail.value });
    },
    onRecverAddrInput(e)  {
      this.setData({ orderDetail.recverAddr: e.detail.value });
    },
    onPostIDInput(e)  {
      if (orderPostID0Needed) {
        this.setData({ orderDetail.postID0: e.detail.value });
      } else if (orderPostID1Needed) {
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
      if (isOwner && this.data.orderDetail.orderStatus == -1) {
        submitGood();
      }
      checkInfo();
      this.data.orderDetail.orderStatus = this.data.orderDetail.orderStatus + 1;
      updateOrderData();
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

    addVideo() {
      const remain = 3 - this.data.goodInfo.videoListLen;
      if (remain <= 0) return wx.showToast({ title: 'MAX 3', icon: 'none' });
      const res = await wx.chooseMedia({ count: remain, mediaType: ['video'], sourceType: ['album', 'camera'] });
      wx.showLoading({ title: 'uploading...' });
      try {
        const urls = await this.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'video');
        const newVideos = urls.map(url => ({ url, thumb: '' }));
        this.setData({ videoList: [...this.data.goodInfo.videoList, ...newVideos] });
        wx.hideLoading();
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: 'FAILED to upload', icon: 'none' });
      }
    },

    deleteVideo(e) {
      const list = [...this.data.videoList];
      list.splice(e.currentTarget.dataset.index, 1);
      this.setData({ goodInfo.videoList: list });
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
    },
    async updateGoodData() {
      try {
        const res = await callCloudFunction('updateGoodsData',
                {
                  goodID: this.data.goodId,
                  ownerID: wx.getStorageSync('userID'),
                  info: this.data.goodInfo
                });
        if (res.code != 0) {
          wx.showToast({ title: res.message || 'FAIL TO UPDATE', icon: 'none' });
        }
      } catch (err) {
        wx.showToast({ title: 'INTERNET ERROR', icon: 'none' });
        console.error(err);
      }
    },
    submitGood() {
      this.data.goodId = createGoodID();
      this.data.goodInfo.goodID = this.data.goodId;
      this.data.goodInfo.ownerID = wx:getStorageSync("userID");
      this.data.goodInfo.bankID = this.data.orderDetail.salerID;
      if (this.data.goodInfo.color.trim()) return wx.showToast({ title: 'COLOR NEEDED', icon: 'none' });
      if (this.data.goodInfo.sizeX.trim()) return wx.showToast({ title: 'SHAPEX NEEDED', icon: 'none' });
      if (this.data.goodInfo.sizeY.trim()) return wx.showToast({ title: 'SHAPEY NEEDED', icon: 'none' });
      if (this.data.goodInfo.sizeZ.trim()) return wx.showToast({ title: 'SHAPEZ NEEDED', icon: 'none' });
      const priceNum = parseFloat(this.data.goodInfo.price);
      if (isNaN(priceNum)) return wx.showToast({ title: 'PRICE NEEDED', icon: 'none' });
      updateGoodData();
    },
    checkOrder() {
      if (!this.data.orderDetail.goodID.trim()) return wx.showToast({ title: 'EMPTY GOODS', icon: 'none' });
      if (!this.data.orderDetail.ownerID.trim()) return wx.showToast({ title: 'EMPTY ownerID', icon: 'none' });
      if (!this.data.orderDetail.salerID.trim()) return wx.showToast({ title: 'EMPTY salerID', icon: 'none' });
      if (!this.data.orderDetail.orderType.trim()) return wx.showToast({ title: 'ORDER TYPE NEEDED', icon: 'none' });

      if (senderAddrNeeded) {
        if (!this.data.orderDetail.senderAddr.trim())
	  return wx.showToast({ title: 'SENDERADDR NEEDED', icon: 'none' });
      }
      if (recverAddrNeeded) {
        if (!this.data.orderDetail.recverAddr.trim())
	  return wx.showToast({ title: 'RECVERADDR NEEDED', icon: 'none' });
      }

      if (this.data.orderPostID0Needed) {
        if (!orderDetail.postID0.trim()) return wx.showToast({title: "EMPTY POSTID", icon: 'none'});
      } else if (this.data.orderPostID1Needed) {
        if (!orderDetail.postID1.trim()) return wx.showToast({title: "EMPTY POSTID", icon: 'none'});
      }
    }
})
