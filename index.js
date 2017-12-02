'use strict';

const https = require('https');

exports.handler = function(event, context, callback) {
    let url = 'https://api.eia.gov/series/?api_key=' + process.env.EIA_API_KEY + '&series_id=EBA.US48-ALL.D.H';

    getData(url, (data) => {
        let units = data.series[0].units;
        let date = new Date(data.series[0].updated);

        let demand_now = data.series[0].data[0][1];
        let demand_percentage_hour_before = Math.round(1000*(demand_now/data.series[0].data[1][1] - 1))/10;
        let demand_percentage_day_before = Math.round(1000*(demand_now/data.series[0].data[24][1] - 1))/10;

        let mainText = 'The current electricity demand is ' + demand_now + ' ' + units +
            ', which is ' + ((demand_percentage_hour_before > 0) ? (demand_percentage_hour_before + '% more than an hour ago') : (-demand_percentage_hour_before + '% less than an hour ago')) +
            ((demand_percentage_hour_before*demand_percentage_day_before > 0) ? (' and ') : (' but ')) + ((demand_percentage_day_before > 0) ? (demand_percentage_day_before + '% more than an day ago') : (-demand_percentage_day_before + '% less than a day ago')) + '.';

        // Return data for API Gateway
        callback(null, {
            statusCode: '200',
            body: JSON.stringify({
                uid: generateUUID(),
                updateDate: date.toISOString(),
                titleText: 'U.S. Electricity Usage',
                mainText: mainText,
                redirectionUrl: 'https://www.eia.gov/beta/realtime_grid/#/summary/demand'
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    });
};

// Gets JSON data from a HTTPS source.
function getData(url, callback) {
    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                callback(JSON.parse(data));
            } catch (e) {
                console.error('err: ', e);
                console.error('url: ', url);
                callback(null);
            }
        });
    }).on('error', (err) => {
        console.error('err: ', err);
        console.error('url: ', url);
        callback(null);
    });
}

// Generates UUIDs
function generateUUID() {
    let i, j;
    let result = 'urn:uuid:';
    for (j = 0; j < 32; j++) {
        if (j == 8 || j == 12 || j == 16 || j == 20) {
            result = result + '-';
        }
        i = Math.floor(Math.random() * 16).toString(16).toUpperCase();
        result = result + i;
    }
    return result;
}
