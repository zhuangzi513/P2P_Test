const { callCloudFunction } = require('../../utils/cloud.js');

Page({
    data:{
      statusMapType0:{
         '100': 'Initialization',
         '102': 'Confirm',
         '103': 'SendToSaler',
         '104': 'ConfirmRecived',
         '105': 'Exhibition',
         '106': 'Hitted',
         '107': 'Selled',
         '108': 'Payed',
         '109': 'Done',
         '120': 'Canceled',
         '121': 'Backing',
         '122': 'Backed',
         '123': 'Closed'
      },
      statusMapType1:{
         '200': 'Initialization',
         '202': 'Payed',
         '103': 'SendToBuyer',
         '104': 'ConfirmRecived',
         '109': 'Done',
         '109': 'Closed',
         '120': 'Canceled',
      },
      orderId:0,
      goodId:0,
      submitting: false,
      loading: true,
      updatingDisabled: true,
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
	senderID:  '',
	recverID:  '',
	senderAddr:  '',
	recverAddr:  '',
	orderStatus:  '',
	orderStatusStr:  '',
	nextStep:  ''
      }
    },
    onLoad:function(e){
      this.setData({
        orderId: e.id,
      })
    },
    onShow() {
      this.orderDetail()
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
      next_status = this.data.orderDetail.orderStatus + 1
      this.data.orderDetail.nextStep = orderDetail.orderType > 0 ? 
         this.statusMapType1.get(next_status) : this.statusMapType0.get(next_status);
    },
    wuliuDetailsTap:function(e){
      var orderId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: "/pages/wuliu/index?id=" + orderDetail.orderId
      })
    },
    confirmBtnTap:function(e) {
      let that = this;
      let orderId = this.data.orderId;
      wx.showModal({
          title: 'CONFIRM GOT IT',
          content: '',
          success: function(res) {
            if (res.confirm) {
              callCloudFunction('orderDelivery', {userID: wx.getStorageSync('uerID'), orderID:orderId}).then(result=> {
                if (result.code == 0) {
                  that.orderDetail()
                }
              })

            }
          }
      })
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
      this.setData({ orderDetail.recverAddr: e.detail.value });
    },
    nextStep()  {
      new_order_status_str = 'FULLFILL INFO'
      switch(orderDetail.orderStatus)
      {
        case '100':
        if (is_sender)
          new_order_status_str = 'ACCEPT'
        else
          new_order_status_str = 'ACCEPT'
        break;
        case '101':
        new_order_status_str = ''
        break;
        case '102':
        break;
        case '103':
        break;
        case '104':
        break;
        case '105':
        break;
        case '106':
        break;
        case '107':
        break;
        case '108':
        break;
        case '109':
        break;
        case '120':
        break;
        case '121':
        break;
        case '122':
        break;
        case '123':
        break;
        case '200':
        break;
        case '202':
        break;
        case '103':
        break;
        case '104':
        break;
        case '109':
        break;
        case '109':
        break;
        case '120':
        break;
      }





      new_order_status = orderDetail.orderStatus + 1;
      new_order_status_str = orderDetail.orderType > 0 ? 
         this.statusMapType1.get(this.data.orderDetail.orderStatus) : this.statusMapType0.get(this.data.orderDetail.orderStatus);
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
      const list = [...this.data.imageList];
      list.splice(e.currentTarget.dataset.index, 1);
      this.setData({ goodInfo.imageList: list });
    },

    async addVideo() {
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

    uploadFiles(filePaths, type) {
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
    async submitGood() {
      this.data.goodId = createGoodID();
      this.data.goodInfo.goodID = this.data.goodId;
      if (this.data.goodInfo.color.trim()) return wx.showToast({ title: 'COLOR NEEDED', icon: 'none' });
      if (this.data.goodInfo.sizeX.trim()) return wx.showToast({ title: 'SHAPEX NEEDED', icon: 'none' });
      if (this.data.goodInfo.sizeY.trim()) return wx.showToast({ title: 'SHAPEY NEEDED', icon: 'none' });
      if (this.data.goodInfo.sizeZ.trim()) return wx.showToast({ title: 'SHAPEZ NEEDED', icon: 'none' });
      const priceNum = parseFloat(this.data.goodInfo.price);
      if (isNaN(priceNum)) return wx.showToast({ title: 'PRICE NEEDED', icon: 'none' });

      try {
        const res = await callCloudFunction('updateGoodsData',
                {
                  goodID: this.data.goodId,
                  ownerID: userID,
                  info: this.data.goodInfo
                });
        wx.hideLoading();
        if (res.code != 0) {
          wx.showToast({ title: res.message || 'FAIL TO UPDATE', icon: 'none' });
        }
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: 'INTERNET ERROR', icon: 'none' });
        console.error(err);
      }
    },
    async submitOrder() {
      if (!this.data.orderDetail.goodID.trim()) return wx.showToast({ title: 'EMPTY GOODS', icon: 'none' });
      if (!this.data.orderDetail.orderType.trim()) return wx.showToast({ title: 'ORDER TYPE NEEDED', icon: 'none' });
      if (!this.data.orderDetail.senderAddr.trim()) return wx.showToast({ title: 'SENDERADDR NEEDED', icon: 'none' });
      if (!this.data.orderDetail.recverAddr.trim()) return wx.showToast({ title: 'RECVERADDR NEEDED', icon: 'none' });

      this.data.orderDetail.orderStatus = this.data.orderDetail.orderStatus + 1;
      if (this.data.orderDetail.orderType === 0) {
         this.data.orderDetail.orderStatusStr = this.statusMapType0.get(this.data.orderDetail.orderStatus);
      } else if (this.data.orderDetail.orderType === 1) {
         this.data.orderDetail.orderStatusStr = this.statusMapType1.get(this.data.orderDetail.orderStatus);
      }

      try {
        const res = await callCloudFunction('updateOrderData',
                orderID: this.data.orderDetail.orderID,
          	orderDetail: this.data.orderDetail
                });
        if (res.code != 0) {
          wx.showToast({ title: res.message || 'FAIL TO UPDATE', icon: 'none' });
        }
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: 'INTERNET ERROR', icon: 'none' });
        console.error(err);
      }
    },
    async submit() {
      this.setData({ submitting: true });
      wx.showLoading({ title: 'SAVING...' });
      submitGood();
      submitOrder();
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.onRefresh) prevPage.onRefresh();
      setTimeout(() => wx.navigateBack(), 1500);
      this.setData({ submitting: false });
    }
})
