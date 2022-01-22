var http = require('http');
var request = require('request');
var express = require('express');
const fs = require('fs');
const detailsFileName = './details.json';
var details = require(detailsFileName);
const Minutes30 = 1800 // 30 mins in seconds

var app = express();

const CLIENT_ID = 'COY45OBZF3ZUQTDFR9WSU0DHCHCQV4WZ';


app.get('/getAppleStockPrice', (req, res) => {
    getAppleStockPrice(res);
});

app.get('/reset', (req, res) => {
    resetAccessToken(res);
});

app.get('/validateToken', (req, res) => {
    validateToken(res)
});

app.get('/placeOrder', (req, res) => {
    placeOrder(res)
});


/**
 * Reset the TDA access token
 */
function resetAccessToken(res) {
    var refresh_token_req = {
        url: 'https://api.tdameritrade.com/v1/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'grant_type': 'refresh_token',
            'refresh_token': details.refresh_token,
            'client_id': CLIENT_ID
        }
    };

    request(refresh_token_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // get the TDA response
            var authReply = JSON.parse(body);
            details.access_token = authReply.access_token;
            details.access_last_update = Date().toString();

            // to check it's correct, display it
            res.send(authReply);

            // write the updated object to the details.json file
            fs.writeFileSync(detailsFileName, JSON.stringify(details, null, 2), function (err) {
                if (err) console.error(err);
            });
        }
    });
}

/**
 * Get Apple Stock Price
 */
 function getAppleStockPrice(res) {
    var stock_price_req = {
        url: 'https://api.tdameritrade.com/v1/marketdata/AAPL/quotes',
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer ' + details.access_token
        },
        form: {
            'apikey': CLIENT_ID
        }
    };

    request(stock_price_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // get the TDA response
            var authReply = JSON.parse(body);

            // to check it's correct, display it
            res.send(authReply.AAPL.lastPrice.toString());
        }
    });
}

/**
 * Place an order to Account
 */
function placeOrder(res) {
    var place_Order_req = {
        url: 'https://api.tdameritrade.com/v1/accounts/493357694/orders',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer ' + details.access_token
        },
        form: {
            "orderType": "MARKET",
  	    "session": "NORMAL",
            "duration": "DAY",
            "orderStrategyType": "SINGLE",
            "orderLegCollection": [
            	{
                  "instruction": "Buy",
                  "quantity": 1,
                  "instrument": {
                    "symbol": "AAPL",
                    "assetType": "EQUITY"
                  }
                }
            ] 
        }
    };

    request(place_Order_req, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // get the TDA response
            var authReply = JSON.parse(body);

            // to check it's correct, display it
            res.send(authReply);
        }
    });
}

/** 
 * returns true if the time difference is more than or equal to the maxDifference
 * maxDifference should be in seconds
*/
function compareTimeDifference(t1, t2, maxDifference) {
    var date1 = new Date(t1);
    var date2 = new Date(t2);

    var diff = Math.floor((date2 - date1) / 1000); // difference in seconds

    return (diff >= maxDifference);
}

function getSecondsDifference(t1, t2, maxDifference) {
    var date1 = new Date(t1);
    var date2 = new Date(t2);

    var diff = Math.floor((date2 - date1) / 1000); // difference in seconds

    return (diff.toString());
}

/**
 * checks if the access is valid and if not then 
 * generate new token
*/
function validateToken(res) {
    let time = Date().toString();

    if (compareTimeDifference(details.access_last_update, time, Minutes30)) {
        resetAccessToken(res);
    }
    
    else{
        res.send(getSecondsDifference(details.access_last_update, time, Minutes30))
    }
}

// start server
var httpServer = http.createServer(app);
var port = process.env.PORT || 8080;
httpServer.listen(port, () => {
    console.log(`Listening at ${port}`);
});
