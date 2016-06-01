'use strict';

(function(exports) {

  function getChartConfig() {
    return {
      type: 'line',
      data: {
        datasets: [{
          label: 'PM2.5 value',
          pointBorderWidth: 0,
          pointBorderColor: '#fff',
          pointHoverRadius: 5,
          pointHoverBorderWidth: 0,
          pointBackgroundColor: '#5cc7B9',
          pointHoverBackgroundColor: '#1cbcad',
          fill: true,
          tension: 0.2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        hover: {
          mode: 'label',
          animationDuration: 0
        },
        tooltips: {
          mode: 'label'
        },
        legend: {
          display: false
        },
        elements: {
          line: {
            borderWidth: .1,
            borderColor: '#88d8cd'
          },
          point: {
            radius: 0,
            borderWidth: 0,
            hitRadius: 10
          }
        },
        scaleLabel: {
          fontColor: '#7d7d7d'
        },
        scales: {
          xAxes: [{
            type: 'time',
            gridLines: {
              display: false
            },
            scaleLabel: {
              display: true
            },
            time: {
              round: true,
              unit: 'hour',
              unitStepSize: 1,
              displayFormats: {
                'hour': 'h:mm a'
              }
            }
          } ],
          yAxes: [{
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'PM2.5 (μg/m)'
            },
            ticks: {
              beginAtZero: true,
              suggestedMax: 100
            }
          }]
        }
      }
    };
  }

  /* FIXME: HOT PATCH GetElementsAtEvent for chartjs version 2.0.0
     Remove it once https://github.com/chartjs/Chart.js/issues/2299 fixed. */
  Chart.Controller.prototype.getElementsAtEvent = function(e) {
    var helpers = Chart.helpers;
    var eventPosition = helpers.getRelativePosition(e, this.chart);
    var elementsArray = [];

    var found = (function() {
      if (this.data.datasets) {
        for (var i = 0; i < this.data.datasets.length; i++) {
          if (helpers.isDatasetVisible(this.data.datasets[i])) {
            for (var j = 0; j < this.data.datasets[i].metaData.length; j++) {
              if (this.data.datasets[i].metaData[j].inLabelRange(eventPosition.x, eventPosition.y)) {
                return this.data.datasets[i].metaData[j];
              }
            }
          }
        }
      }
    }).call(this);

    if (!found) {
      return elementsArray;
    }

    helpers.each(this.data.datasets, function(dataset) {
      if (helpers.isDatasetVisible(dataset)) {
        elementsArray.push(dataset.metaData[found._index]);
      }
    });

    return elementsArray;
  };

  var draw = Chart.controllers.line.prototype.draw;
  // Extend the draw function to draw:
  //  - additional horizontal line for DAQI level
  //  - gradient color of the chart
  Chart.controllers.line = Chart.controllers.line.extend({
    setDAQIGradient: function() {
      var ctx = this.chart.chart.ctx;
      var yScale = this.chart.scales['y-axis-0'];
      var end = yScale.end;
      var top = yScale.top;
      var bottom = yScale.bottom;
      var gradient = ctx.createLinearGradient(0,bottom,0,top);

      gradient.addColorStop(70 / end,'#c3b3e4');
      gradient.addColorStop(54 / end,'#faafce');
      gradient.addColorStop(36 / end,'#ffde9b');
      gradient.addColorStop(0,'#94dbbb');
      this.chart.config.data.datasets[0].backgroundColor = gradient;
    },
    drawDAQILines: function() {
      if (!DRAW_DAQI_LINE) {
        return;
      }

      function yPosConverter(value) {
        var end = yScale.end;
        var top = yScale.top;
        var bottom = yScale.bottom;
        return (end - value) / end * (bottom - top) + top;
      }
      // draw line
      var ctx = this.chart.chart.ctx;
      var xScale = this.chart.scales['x-axis-0'];
      var yScale = this.chart.scales['y-axis-0'];
      var lines = [
        {
          value: 71,
          color: 'purple'
        },
        {
          value: 54,
          color: 'red'
        },
        {
          value: 36,
          color: 'gold'
        }
      ];

      for (var i = lines.length; --i >= 0;) {
        ctx.beginPath();
        ctx.moveTo(xScale.left, yPosConverter(lines[i].value));
        ctx.lineWidth = 1;
        ctx.strokeStyle = lines[i].color;
        ctx.lineTo(xScale.right, yPosConverter(lines[i].value));
        ctx.stroke();
        ctx.closePath();
      }
    },
    draw: function() {
      this.setDAQIGradient();
      draw.call(this, arguments[0]);
      this.drawDAQILines();
    }
  });

  exports.ChartUtils = {
    getChartConfig: getChartConfig
  };

})(window);
