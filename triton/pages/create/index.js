// pages/upload/upload.js

import WXAPI from 'apifm-wxapi';

Page({
  data: {
    id: '',
    color: '',
    sizeX: '',
    sizeY: '',
    sizeZ: '',
    priceHigh: '',
    priceLow: '',
    imageList: [],
    videoList: [],
    submitting: false,
  },

  onLoad(options) {
    const id = options.id || '';
    this.setData({ id });
    if (!id) {
      wx.showToast({ title: 'ERROR: No ID provided', icon: 'none' });
    }
  },

  onColorInput(e) {
    this.setData({ color: e.detail.value });
  },
  onSizeXInput(e) {
    this.setData({ sizeX: e.detail.value });
  },
  onSizeYInput(e) {
    this.setData({ sizeY: e.detail.value });
  },
  onSizeZInput(e) {
    this.setData({ sizeZ: e.detail.value });
  },
  onHighPriceInput(e) {
    this.setData({ priceHigh: e.detail.value });
  },
  onLowPriceInput(e) {
    this.setData({ priceLow: e.detail.value });
  },

  chooseImage() {
    const remain = 9 - this.data.imageList.length;
    if (remain <= 0) {
      wx.showToast({ title: 'Limiation: 9 pics', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const validFiles = res.tempFiles.filter(file => file.size <= 10 * 1024 * 1024);
        if (validFiles.length < res.tempFiles.length) {
          wx.showToast({ title: 'files whose size overflows, deleted', icon: 'none' });
        }
        const newPaths = validFiles.map(item => item.tempFilePath);
        this.setData({
          imageList: this.data.imageList.concat(newPaths)
        });
      }
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = [...this.data.imageList];
    newList.splice(index, 1);
    this.setData({ imageList: newList });
  },

  chooseVideo() {
    const remain = 3 - this.data.videoList.length;
    if (remain <= 0) {
      wx.showToast({ title: 'Limitation: 3 videos', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      success: (res) => {
        const videos = res.tempFiles.map(item => ({
          tempFilePath: item.tempFilePath,
          thumbTempFilePath: item.thumbTempFilePath
        }));
        this.setData({
          videoList: this.data.videoList.concat(videos)
        });
      }
    });
  },

  deleteVideo(e) {
    const index = e.currentTarget.dataset.index;
    const newList = [...this.data.videoList];
    newList.splice(index, 1);
    this.setData({ videoList: newList });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.imageList
    });
  },

  async submit() {
    if (this.data.submitting) return;

    if (!this.data.color.trim()) {
      wx.showToast({ title: '请输入颜色', icon: 'none' });
      return;
    }
    if (!this.data.sizeX.trim() || !this.data.sizeY.trim() || !this.data.sizeZ.trim()) {
      wx.showToast({ title: '请完整填写尺寸', icon: 'none' });
      return;
    }
    const priceHigh = parseFloat(this.data.priceHigh);
    const priceLow = parseFloat(this.data.priceLow);
    if (isNaN(priceHigh) || isNaN(priceLow)) {
      wx.showToast({ title: '价格必须是数字', icon: 'none' });
      return;
    }
    if (!this.data.id) {
      wx.showToast({ title: '关联ID缺失', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '上传中...', mask: true });

    try {
      // 1. 上传所有图片（使用WXAPI.uploadFile）
      const imageUrls = await this.uploadFiles(this.data.imageList, 'image');

      // 2. 上传所有视频（使用WXAPI.uploadFile）
      const videoUrls = await this.uploadFiles(this.data.videoList.map(v => v.tempFilePath), 'video');

      // 3. 调用数据库API保存数据
      const result = await this.callAssociateAPI({
        id: this.data.id,
        color: this.data.color.trim(),
        sizeX: this.data.sizeX.trim(),
        sizeY: this.data.sizeY.trim(),
        sizeZ: this.data.sizeZ.trim(),
        priceHigh: priceHigh,
        priceLow: priceLow,
        images: imageUrls,
        videos: videoUrls
      });

      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error(err);
      wx.hideLoading();
      wx.showToast({ title: err.message || '上传失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 上传文件（使用WXAPI.uploadFile）
  uploadFiles(filePaths, type) {
    if (!filePaths.length) return Promise.resolve([]);
    // 并发控制，每次最多同时上传3个文件，避免请求阻塞
    const concurrency = 3;
    const results = [];
    let index = 0;

    const uploadNext = () => {
      if (index >= filePaths.length) return Promise.resolve();
      const currentIndex = index++;
      return WXAPI.uploadFile(filePaths[currentIndex])
        .then(res => {
          if (res.code === 0 && res.data) {
            results[currentIndex] = res.data.url; // 确保顺序
          } else {
            throw new Error(res.message || `上传${type}失败`);
          }
        })
        .catch(err => {
          throw new Error(`${type} ${filePaths[currentIndex]} 上传失败: ${err.message}`);
        })
        .then(() => uploadNext());
    };

    const promises = [];
    for (let i = 0; i < Math.min(concurrency, filePaths.length); i++) {
      promises.push(uploadNext());
    }
    return Promise.all(promises).then(() => results.filter(url => url)); // 过滤掉可能的空值
  },

  // 调用数据库API
  callAssociateAPI(params) {
    return new Promise((resolve, reject) => {
      // 使用WXAPI.add方法向指定集合添加数据
      WXAPI.add('goods', params).then(res => {
        if (res.code === 0) {
          resolve(res);
        } else {
          reject(new Error(res.message || '关联失败'));
        }
      }).catch(err => {
        reject(err);
      });
    });
  }
});
