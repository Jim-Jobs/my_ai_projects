Page({
  data: {
    samples: [
      { t: '「再睡五分钟」· 起床困难户', e: '这里躺着一位与闹钟搏斗一生的勇士。' },
      { t: '「明天再说」· 拖延晚期', e: '他把"明天"活成了永远。' },
      { t: '「下次一定」· 立flag专业户', e: 'flag 倒了，人还站着。' }
    ]
  },
  goSelf() {
    wx.navigateTo({ url: '/pages/create/create?mode=self' });
  },
  goFriend() {
    wx.navigateTo({ url: '/pages/create/create?mode=friend' });
  }
});
