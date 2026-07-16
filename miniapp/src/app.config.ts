export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/training/index',
    'pages/data/index',
    'pages/profile/index',
    'pages/custom-projects/index',
    'pages/privacy/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationStyle: 'custom',
    backgroundColor: '#10110f'
  },
  tabBar: {
    color: '#83847f',
    selectedColor: '#136df5',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/home/index', text: '首页', iconPath: 'assets/tabbar/home.png', selectedIconPath: 'assets/tabbar/home-active.png' },
      { pagePath: 'pages/training/index', text: '训练', iconPath: 'assets/tabbar/training.png', selectedIconPath: 'assets/tabbar/training-active.png' },
      { pagePath: 'pages/data/index', text: '数据', iconPath: 'assets/tabbar/data.png', selectedIconPath: 'assets/tabbar/data-active.png' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: 'assets/tabbar/profile.png', selectedIconPath: 'assets/tabbar/profile-active.png' }
    ]
  }
})
