Page({
  data: {
    data: { name: '我', epitaph: '', highlights: [], comments: [] }
  },

  onLoad() {
    const d = wx.getStorageSync('tombstone_result');
    if (d) this.setData({ data: d });
  },

  regenerate() {
    wx.navigateBack();
  },

  save() {
    this.drawCard();
  },

  drawCard() {
    const d = this.data.data;
    const W = 300;
    const H = 560;
    const ctx = wx.createCanvasContext('card', this);

    // 背景
    ctx.setFillStyle('#1c1c24');
    ctx.fillRect(0, 0, W, H);
    ctx.setTextAlign('center');

    // 十字 + 名字
    ctx.setFillStyle('#d9a95c');
    ctx.setFontSize(22);
    ctx.fillText('✝', W / 2, 48);
    ctx.setFillStyle('#ffffff');
    ctx.setFontSize(20);
    ctx.fillText(d.name || '我', W / 2, 84);

    // 墓志铭（按字符数换行）
    let y = 120;
    ctx.setFillStyle('#e8e4d8');
    ctx.setFontSize(14);
    wrapByChars(d.epitaph || '', 14).forEach(l => { ctx.fillText(l, W / 2, y); y += 22; });

    // 高光回顾
    y += 8;
    ctx.setTextAlign('left');
    ctx.setFillStyle('#d9a95c');
    ctx.setFontSize(12);
    ctx.fillText('人生高光回顾（离谱版）', 20, y);
    y += 20;
    ctx.setFillStyle('#e8e4d8');
    ctx.setFontSize(13);
    (d.highlights || []).forEach(h => {
      wrapByChars(h, 18).forEach(l => { ctx.fillText(l, 20, y); y += 20; });
    });

    // 亲友寄语
    y += 8;
    ctx.setFillStyle('#d9a95c');
    ctx.setFontSize(12);
    ctx.fillText('亲友寄语', 20, y);
    y += 20;
    ctx.setFillStyle('#e8e4d8');
    ctx.setFontSize(13);
    (d.comments || []).forEach(c => {
      wrapByChars(c, 18).forEach(l => { ctx.fillText(l, 20, y); y += 20; });
    });

    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'card',
        success: res => {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
            fail: () => wx.showToast({ title: '保存失败，请授权相册', icon: 'none' })
          });
        },
        fail: () => wx.showToast({ title: '生成图片失败', icon: 'none' })
      }, this);
    });
  },

  onShareAppMessage() {
    return {
      title: '来看看我给你/自己立的碑，笑死',
      path: '/pages/index/index'
    };
  }
});

function wrapByChars(s, n) {
  const out = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out.length ? out : [''];
}
