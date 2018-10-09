# Web application for visualization

## Setup

### Installing Node.js

Please refer to the official documentation: https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions

### Installing dependencies

To install the required Node modules, run `npm install` in the `webapp` directory.

### Running the app
To feed the realtime stats into the database:
```
node stats_producer.js
```
To start the webserver:
```
node app.js
```
## Endpoints

### Realtime Twitter coarse stats (for the moment: tweet counts)
http://35.234.78.152:3000/twitter
### Realtime Twitter keyword stats
http://35.234.78.152:3000/twitter_keywords
### Historical charts
http://35.234.78.152:3000/historical/1
