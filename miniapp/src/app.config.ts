export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/training/index',
    'pages/data/index',
    'pages/profile/index'
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
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/training/index', text: '训练' },
      { pagePath: 'pages/data/index', text: '数据' },
      { pagePath: 'pages/profile/index', text: '我的' }
    ]
  }
})
