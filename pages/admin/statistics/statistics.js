var wxCharts = require('../../../utils/wxcharts-min.js');
Page({
  onReady() {
    const systemInfo = wx.getSystemInfoSync();
    const windowWidth = systemInfo.windowWidth;

    new wxCharts({
      canvasId: 'lineCanvas',
      type: 'line',
      categories: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      series: [{
        name: 'p1',
        data: [0.15, 0.2, 0.45, 0.37, 0.4, 0.8, 0.9, 0.45, 0.37, 0.4, 0.8, 0.9],
        format: function (val) {
          return val.toFixed(2) + '万';
        }
      }, {
        name: 'p2',
        data: [0.30, 0.37, 0.65, 0.78, 0.69, 0.94, 1.0, 0.65, 0.78, 0.69, 0.94, 1.0],
        format: function (val) {
          return val.toFixed(2) + '万';
        }
      }],
      yAxis: {
        title: '成交金额 (万元)',
        format: function (val) {
          return val.toFixed(2);
        },
        min: 0
      },
      width: windowWidth,
      height: 200,
      extra: {
        lineStyle: 'curve' // 平滑曲线
      }
    });


  }
});