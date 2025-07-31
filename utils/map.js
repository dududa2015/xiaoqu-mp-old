const buildMarkers = (latitude, longitude, uid, name, type, userId, deleted) => {
  let bgColor = getBgColorByType(type)
  let anchorX = getAnchorX(name)
  if (deleted === -1) {
    name = name.substring(0, 2) + '***（审核中）'
  }
  let markers = {
    id: parseInt(uid),
    iconPath: '/images/marker-0.png',
    width: 1,
    height: 1,
    latitude: latitude,
    longitude: longitude,
    userId
  }
  let markerShape = wx.getStorageSync('markerShape')
  if (markerShape === 'label' || !markerShape) {
    markers.callout = null
    markers.label = {
      content: name,
      borderWidth: 0.4,
      borderColor: "#f7f7f7",
      borderRadius: 8,
      bgColor,
      color: "#fff",
      padding: 3,
      fontSize: 12,
      textAlign: "center",
      anchorY: -16,
      anchorX: anchorX
    }
  } else {
    markers.callout = {
      content: name,
      color: '#fff',
      bgColor,
      padding: getApp().globalData.padding,
      fontSize: 11,
      borderRadius: 7,
      display: 'ALWAYS'
    }
    markers.label = null
  }
  return markers
}

function getAnchorX(name) {
  if (getApp().globalData.isAndroid) {
    let len = getTextByteLen(name)
    return -(len + 2) * 11 * 0.25
  } else {
    return 0
  }
}

function getTextByteLen(text) {
  var length = 0;
  text.split('').map(function (char) {
    if (char.charCodeAt(0) > 255) { //字符编码大于255，说明是双字节字符  
      length += 2;
    } else {
      length++;
    }
  });
  return length;
}
//根据类型获取背景色，紫色：#722ED1
function getBgColorByType(type) {
  let bgColor = ''
  if (type === 0) {
    bgColor = '#0074FE'
  } else if (type === 1) {
    bgColor = '#E85827'
  } else if (type >= 2 && type <= 6) {
    bgColor = '#8c444f'
  } else if (type === 7) {
    bgColor = '#3CB371'
  } else if(type === 8) {
    bgColor = '#dc143c'
  } else {
    bgColor= '#B23AEE'
  }
  return bgColor
}

const buildPolyline = (points, type, xId) => {
  let polyline = {
    xId: xId,
    points: points,
    color: buildPolylineColor(type),
    width: 5,
    arrowLine: true,
    arrowIconPath: type === 7 ? '' : '/images/forbid.png',
    level: 'abovebuildings',
    segmentTexts: [{
      name: type === 7 ? '可通行' : '围墙',
      startIndex: 0,
      endIndex: points.length - 1,
    }],
    textStyle: {
      textColor: '#333333',
      strokeColor: '#ffffff',
      fontSize: 11
    }
  }
  return polyline
}

const buildPolygon = (polyline) => {
  const points = polyline.split('_')
    .map(coordPair => {
      const [longitude, latitude] = coordPair.split(',');

      // 验证坐标格式
      if (!longitude || !latitude || isNaN(longitude) || isNaN(latitude)) {
        throw new Error(`Invalid coordinate format: ${coordPair}`);
      }

      return {
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude)
      };
    });

  return {
    dashArray: [30, 10],
    points,
    strokeWidth: 2,
    strokeColor: '#0074FE',
    fillColor: '#0074FE20',
    zIndex: 0
  };
}

function buildPolylineColor(type) {
  if (type === 7) {
    return '#3CB371'
  } else {
    return '#dc143c'
  }
}

module.exports = {
  buildMarkers,
  buildPolyline,
  buildPolygon
}