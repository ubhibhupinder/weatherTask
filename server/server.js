var http = require('http');
var eventEmits = require("events").EventEmitter;
var https = require('https');
var util = require("util");
var key = 'ffca3c6398db6c5e39d0e1284dbea546';
var query = '?exclude=currently,minutely,daily,alerts,flags&units=si';

var responses = { "locData" : []};
var weatherData = { "items" : []};
var locations = {"items": []};
	

var startServer = function(req, res) {
//var locations = req.locations;
locations = {"items":[{"name" : "Sydney", "lat" : "-33.8700308", "lng" : "151.2116687"},
						  {"name" : "New York", "lat" : "40.705311", "lng" : "-74.2581855"},
						  {"name" : "London", "lat" : "51.5285582", "lng" : "-0.2416806"} ]};
getWeatherData(locations, req, res);
//res.end();
}

var getWeatherData = function(locations, req, res)
{
/*	if(weatherData.length == 0)
	{
		weatherData = newArray(locations.items.length);
	}
*/
	var foundWeatherData = [];
	var foundResponsesData = [];
	var howManyDone = 0;
	for(var idxLocations = 0 ; idxLocations < locations.items.length; idxLocations++)
	{
		var fndIdxWeatherData = "", fndIdxResponses = "";
		weatherData.items.find(function(item , index) {
			if(item.name === locations.items[idxLocations].name)
			{
				fndIdxWeatherData = item.name;
			}
		});
		if(fndIdxWeatherData == "")
		{
			var extServerOptions = {
				host: 'api.darksky.net',
				path: '/forecast/'+key+"/"+locations.items[idxLocations].lat+","+locations.items[idxLocations].lng+query,
				method: 'GET'
			};
			
			var weatherGetter = new getWeather(extServerOptions , idxLocations);
			
			weatherGetter.on("data", function(){
				console.log("got data");
			});
			
			weatherGetter.on("end", function(thisDarkSkyResponse){
				var thisResponseData = new Object();
				thisResponseData.name = locations.items[thisDarkSkyResponse.locationsIndex].name;
				thisResponseData.drkSkyResp = thisDarkSkyResponse;
				responses.locData.push(thisResponseData);
				foundWeatherData.push(responses.length-1);

				var thisWeatherData = new Object();
				thisWeatherData.name = locations.items[thisDarkSkyResponse.locationsIndex].name;
				thisWeatherData.lat = locations.items[thisDarkSkyResponse.locationsIndex].lat;
				thisWeatherData.lng = locations.items[thisDarkSkyResponse.locationsIndex].lng;
				var avgTemp = 0.0 , avgHumidity = 0.0 , avgPressure = 0.0;
				for(var iHourly = 0 ; iHourly < thisResponseData.drkSkyResp.hourly.data.length ; iHourly++)
				{
					avgTemp += thisResponseData.drkSkyResp.hourly.data[iHourly].temperature;
					avgHumidity += thisResponseData.drkSkyResp.hourly.data[iHourly].humidity;
					avgPressure += thisResponseData.drkSkyResp.hourly.data[iHourly].pressure;
				}
				avgTemp = Math.round((avgTemp/thisResponseData.drkSkyResp.hourly.data.length) * 100) / 100;
				avgHumidity = Math.round((avgHumidity/thisResponseData.drkSkyResp.hourly.data.length) * 100) / 100;
				avgPressure = Math.round((avgPressure/thisResponseData.drkSkyResp.hourly.data.length) * 100) / 100;
				thisWeatherData.avgTemp = avgTemp;
				thisWeatherData.avgHumidity = avgHumidity;
				thisWeatherData.avgPressure = avgPressure;
				weatherData.items.push(thisWeatherData);
				howManyDone++;
				if(howManyDone == idxLocations)
				{
					sendDataToBrowser(res);
				}
			});
			
			weatherGetter.on("error", function(error){
				console.log("error " + error);
			});
			
		}
		else{
			foundWeatherData.push(fndIdxWeatherData);
			responses.locData.find(function(item , index) {
				if(item.name === locations.items[idxLocations].name)
				{
					fndIdxResponses = item.name;
				}
			});
			foundResponsesData.push(fndIdxResponses);
		}
	}
	
	for(var idxWeatherData = 0 ; idxWeatherData < weatherData.items.length; idxWeatherData++)
	{
		var found = false;
		foundWeatherData.find(function(item , index) { 
			if(item === weatherData.items[idxWeatherData].name)
			{
				found = true;
			}
		});
		if(!found)
		{
			weatherData.splice(idxWeatherData , 1);
		}
	}	
	for(var idxResponses = 0 ; idxResponses < responses.locData.length; idxResponses++)
	{
		var found = false;
		foundResponsesData.find(function(item , index) { 
			if(item === responses.locData[idxResponses].name)
			{
				found = true;
			}
		});
		if(!found)
		{
			responses.splice(idxResponses , 1);
		}
	}
	if(locations.items.length == weatherData.items.length)
	{
		sendDataToBrowser(res);
	}
//	return weatherData;
	
}

var getWeather = function(extServerOptions , idxLocations) {
    eventEmits.call(this);
    weatherEmitter = this;

    var request = https.get(extServerOptions, function (resp) {
        var body = "";

        resp.on('data', function (chunk) {
            body += chunk;
			weatherEmitter.emit("data");
        });

        resp.on('end', function () {
            if (resp.statusCode === 200) {
                try {
                    var thisDarkSkyResponse = JSON.parse(body);
					thisDarkSkyResponse.locationsIndex = idxLocations;
					weatherEmitter.emit("end" , thisDarkSkyResponse);
                } catch (error) {
					weatherEmitter.emit("error" , error);
                }
            }
        });
		
		resp.on("error", function (error) {
            console.log("error", error);
        });
    });
}

var sendDataToBrowser = function(res){

	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	res.setHeader('Access-Control-Allow-Credentials', true);
	res.setHeader('Content-Type', 'application/json');
	res.writeHead(200);
	res.end(JSON.stringify(weatherData));
}

util.inherits( getWeather, eventEmits);

var server = http.createServer(startServer);
server.listen(8081);