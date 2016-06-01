'use strict';

(function(exports){
  $(document).ready(function(){
    if (!navigator.userAgent.match(/Android/i)) {
      return;
    }

    document.querySelector('#app-download-li').classList.remove('hide');
    $('.modal-trigger').leanModal();

    if (localStorage.getItem('isDownloadModalShowed') === 'true') {
      return;
    }
    setTimeout(function() {
      $('#app-dl-modal').openModal();
      localStorage.setItem('isDownloadModalShowed', 'true');
    }, 5000);
  });

  const CHART_FORMAT = 'LLL';
  const CONTRIBUTOR_MARKUP ='<div class="col s6 m3 l2"><div class="card">' +
    '<a href="user.html?id=${userId}"><div class="card-image">' +
    '<img src="${picture}"></div></div></a>' +
    '<p id="contributor-name" class="center-align">${name}</p></div>';


  // TODO: Maybe we should remove it once server-side rendering is ready?
  // var projectId = $.url().param('id');
  var latestSensors;

  var gMap;
  var markerMap = new Map();
  var flag = false;

  var dataChartContainer =
    document.getElementById('sensor-data-chart-container');
  var ctx = $('#sensor-data-chart').get(0).getContext('2d');
  var dataChart;

  var chartName = $('#sensor-information .name');
  var chartDescription = $('#sensor-information .description');
  var chartValue = $('#sensor-information .value');
  var chartStatus = $('#sensor-information .status');
  var chartLatestUpdate = $('#sensor-information .latest-update');
  var chartCloseBtn = $('#chart-close-btn');

  chartCloseBtn.click(function () {
    dataChartContainer.classList.add('hide');
    if (dataChart) {
      dataChart.destroy();
      flag = false;
    }
  });

  $('#sensors-location-map').click(function() {
    if(flag) {
      dataChartContainer.classList.add('hide');
      if (dataChart) {
        dataChart.destroy();
        flag = false;
      }
    }
  });



  function dataConvertion(dataArray) {
    var config = ChartUtils.getChartConfig();
    config.data.datasets[0].data = dataArray.map(function(d) {
      return { x: moment(d.datetime).format(CHART_FORMAT),
               // FIXME: Remove `pm25Index`.
               y: d.pm25Index || d.data.pm25 };
    });
    return config;
  }

  function getGeolocation() {
    return new Promise(function(resolve, reject) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          // TODO: Maybe we can set a geolocation icon here?
          // var gMapMarker = new google.maps.Marker({
          //   position: pos,
          //   map: gMap,
          //   zIndex: -1
          // });

          // gMapMarker.setIcon('images/location.png');
          resolve(pos);
        }, function() {
          reject('Browser unable to get current location');
        });
      } else {
        reject('Browser doesn\'t support Geolocation');
      }
    });
  }

  function updateMap(sensors) {
    if (!gMap || !sensors) {
      return;
    }

    var bound = new google.maps.LatLngBounds();

    sensors.forEach(function(sensor, index) {
      if (markerMap.has(sensor._id)) {
        return;
      }

      var coords = sensor.coords;
      var gMapMarker = new google.maps.Marker({
        position: { lat: Number(coords.lat), lng: Number(coords.lng) },
        map: gMap,
        title: sensor.name,
        // Place the invliad marker to bottom
        zIndex: sensor.pm25Index ? index + 1 : 0,
        icon: DAQI[getDAQIStatus(sensor.pm25Index)].iconURL
      });

      bound.extend(
        new google.maps.LatLng(Number(coords.lat), Number(coords.lng))
      );

      gMapMarker.addListener('click', function() {
        chartName.text(sensor.name);
        chartDescription.text(sensor.description);
        chartValue.text(sensor.pm25Index || 'Invalid');
        chartValue.attr('data-status', getDAQIStatus(sensor.pm25Index));
        chartStatus.text(DAQI[getDAQIStatus(sensor.pm25Index)].banding);
        chartStatus.attr('data-status', getDAQIStatus(sensor.pm25Index));
        chartLatestUpdate.text(moment(sensor.latestUpdate).fromNow());
        dataChartContainer.classList.remove('hide');
        $('#sensor-details').attr('href','./sensor.html?id=' + sensor._id);

        $.ajax({
          url: API_URL + 'sensors/' + sensor._id + '/data',
          dataType: 'jsonp'
        })
        .done(function(dataArray) {
          dataChart = new Chart(ctx, dataConvertion(dataArray));
          flag = true;
        })
        .fail(function(error) {
          console.error(error);
        });
      });

      markerMap.set(sensor._id, gMapMarker);
    });

    gMap.setCenter(bound.getCenter());
    gMap.fitBounds(bound);

    getGeolocation().then(function(pos) {
      gMap.setCenter(pos);
      gMap.setZoom(16/* TODO: Refine this part to set correct scale*/);
    }, function(e) {
      console.log(e);
    });
  }

  function renderContributorList(contributors) {
    $.tmpl(CONTRIBUTOR_MARKUP, contributors).appendTo('#contributor-list');
  }

  function initMap() {
    var mapElement = document.getElementById('sensors-location-map');

    gMap = new google.maps.Map(mapElement, {
      streetViewControl: false,
      scrollwheel: false
    });

    updateMap(latestSensors);
  }

  // Fetch project detail, should set project ID as parameter
  $.ajax({
    url: API_URL + 'projects/sensorweb/pm25',
    dataType: 'jsonp'
  })
  .done(function(project) {
    $('#pm25 .description').text(project.description);
    $('#pm25 .creator').text(project.creator.name);
    // $('#pm25 .last-update').text(project.detail);
    $('#pm25 .created-date').text(moment(project.createDate).format('LL'));
  })
  .fail(function(error) {
    console.error(error);
  });

  // Fetch sensor list
  $.ajax({
    url: API_URL + 'projects/sensorweb/pm25/sensors',
    dataType: 'jsonp'
  })
  .done(function(sensors) {
    latestSensors = sensors;
    updateMap(latestSensors);
  })
  .fail(function(error) {
    console.error(error);
  });

  // Fetch user list, should set project ID as parameter
  $.ajax({
    url: API_URL + 'projects/sensorweb/pm25/contributors',
    dataType: 'jsonp'
  })
  .done(function(contributors) {
    $('#pm25 .contributors').text(contributors.length);
    renderContributorList(contributors);
  })
  .fail(function(error) {
    console.error(error);
  });

  exports.initMap = initMap;

})(window);
