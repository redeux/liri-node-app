'use strict';
//Define Variables
let spotify = require('spotify');
let twitter = require('twitter');
let keys = require('./keys.js');
let request = require('request');
let fs = require('fs');
let userInput = {
    command: '',
    arguement: ''
};

//Main Logic
//Process command line arguements 
if (process.argv.length > 2) {
    let rawInputs = [];
    for (let i = 2; i < process.argv.length; i++) {
        rawInputs.push(process.argv[i]);
    }
    userInput.command = rawInputs.splice(0, 1)[0].toLowerCase();
    userInput.arguement = rawInputs.join(' ');
    writeLog('User Input - ' + JSON.stringify(userInput));
}

//Call the main function
mainProcess(userInput.command, userInput.arguement);

function mainProcess(command, arg) {
    //Check user command and perform appropriate task
    switch (command) {
        case ('my-tweets'):
            //myTweets(userName, onSuccess, onFailure)
            myTweets('DumDumDummyUser', (tweets) => {
                if (tweets.length >= 20) {
                    //Display the last 20 tweets unless there are less than 20, then display them all
                    for (let i = 0; i < 20; i++) {
                        console.log(tweets[i].text + ' - ' + tweets[i].created_at);
                    }
                } else {
                    for (let i = 0; i < tweets.length; i++) {
                        console.log(tweets[i].text + ' - ' + tweets[i].created_at);
                    }
                }
            }, (error) => {
                displayError();
            });
            break;
        case ('spotify-this-song'):
            //SpotifyThisSong(song, onSuccess, onFailure)
            SpotifyThisSong(arg, (data) => {
                console.log('Artist:  ' + data.tracks.items[0].artists[0].name);
                console.log('Album:   ' + data.tracks.items[0].album.name);
                console.log('Song:    ' + data.tracks.items[0].name);
                console.log('Preview: ' + data.tracks.items[0].preview_url);
            }, (error) => {
                if (error === 'No results found') {
                    console.log(error + '. Check your spelling and try again.');
                } else {
                    displayError();
                }
            });
            break;
        case ('movie-this'):
            //movieThis(title, onSuccess, onFailure)
            movieThis(arg, (movie) => {
                console.log('Title:               ' + movie.Title);
                console.log('Year Released:       ' + movie.Year);
                console.log('IMDB Rating:         ' + movie.imdbRating);
                console.log('Country Produced:    ' + movie.Country);
                console.log('Language(s):         ' + movie.Language);
                console.log('Plot:                ' + movie.Plot);
                console.log('Actors:              ' + movie.Actors);
                console.log('Rotten Tomatoes URL: ' + movie.tomatoURL);
            }, (error) => {
                if (error === 'Movie not found') {
                    console.log(error + '. Check your spelling and try again.');
                } else {
                    displayError();
                }
            });
            break;
        case ('do-what-it-says'):
            doWhatItSays();
            break;
        case ('--help'):
            displayHelp();
            break;
        default:
            writeLog('Error: Invalid Input');
            console.log('Error: Invalid Input');
            displayHelp();
            break;
    }
}

//Supporting Functions
function displayHelp() {
    //Displays the valid commaands and what they do
    writeLog('Displaying help ...');

    let helpText = [
        '',
        'Usage: node liri.js [command] [arguments]',
        '',
        'Commands:',
        ' my-tweets             Shows last 20 tweets and when they were created',
        ' spotify-this-song     Shows information about the song',
        ' movie-this            Shows infotmation about the movie',
        ' do-what-it-says       Takes text inside of random.txt and then use it to call one of LIRI\'s commands'
    ]

    helpText.map(function(v) {
        console.log(v);
    })

    writeLog(JSON.stringify(helpText));
}

function displayError() {
    //Displays the unknown error msg
    console.log('Something went wrong.  Please try again or check the logs for more information');
}

function myTweets(userName, onSuccess, onFailure) {
    //Queries a user and returns an array of their tweets
    writeLog('Searching for tweets ...');

    let client = new twitter({
        consumer_key: keys.twitterKeys.consumer_key,
        consumer_secret: keys.twitterKeys.consumer_secret,
        access_token_key: keys.twitterKeys.access_token_key,
        access_token_secret: keys.twitterKeys.access_token_secret
    });

    let params = { screen_name: userName };

    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if (!error) {
            writeLog(JSON.stringify(tweets));
            return onSuccess(tweets);
        } else {
            writeLog(JSON.stringify(error));
            return onFailure(error);
        }
    });
}

function SpotifyThisSong(song, onSuccess, onFailure) {
    //Looks up a Spotify song and retuns it if found.  If no song is supplied returns Ace of Base - The Sign
    writeLog('Searching for song ' + song + ' ...');

    if (song === '') {
        song = "Ace of Base The Sign";
    }

    spotify.search({ type: 'track', query: song }, function(error, data) {
        if (error) {
            writeLog('Error: ' + error);
            return onFailure(true);
        } else if (data.tracks.items.length === 0) {
            writeLog('Error: No results found');
            return onFailure('No results found');
        } else {
            writeLog('Success: ' + JSON.stringify(data))
            return onSuccess(data);
        }
    });
}

function movieThis(title, onSuccess, onFailure) {
    //Looks up a movie on OMDB and returns information about it if found.  If no movie is supplied returns Mr. Nobody
    if (title === '') {
        title = 'Mr. Nobody';
    }

    let omdbURL = 'http://www.omdbapi.com/?t=' + title + '&type=movie&plot=short&tomatoes=true&r=json';

    writeLog('Searching for movie at ' + omdbURL + ' ...');

    request(omdbURL, function(error, response, bodyString) {
        let body = JSON.parse(bodyString);
        if (!error && response.statusCode === 200) {
            writeLog(JSON.stringify(response));
            if (body.Response === 'True') {
                return onSuccess(body);
            } else {
                return onFailure('Movie not found');
            }
        } else {
            writeLog('Status Code: ' + response.statusCode + ' Error: ' + JSON.stringify(error));
            return onFailure(true);
        }
    })
}

function doWhatItSays() {
    //Takes the command in random.txt and executes it
    let fileName = './random.txt';

    writeLog('Executing doWhatItSays on ' + fileName + ' ...');

    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) throw err;
        let values = data.split(',');
        writeLog(fileName + ' Input - ' + JSON.stringify(values));
        mainProcess(values[0], values[1]);
    });
}

function writeLog(msg) {
    //Writes msg to log file with timestamp
    let logFile = './log.txt';
    fs.appendFile(logFile, Date.now() + ' ' + msg + '\n', (err) => {
        if (err) throw err;
    });
}
