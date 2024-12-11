const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { Parser } = require('json2csv'); // Makes converting json to .csv easier
const app = express();
const port = 80;

// Debug variable for storing latest POST message text
let postMessage = '';

app.use(express.json({ limit: '500mb' })); // Yes the file size is nuts, but at least I wasn't going to let the size limit botch any of my tests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('/var/www/html'));

app.get('/', (req, res) => {
    res.sendFile(path.join('/var/www/html', 'index.html'));
});

// Handling data sent from the Android application
app.post('/submit_data', (req, res) => {
    // Get deviceId and data array from request body
    const { deviceId, data } = req.body;

    // Create a folder path for the device using its deviceId
    const deviceFolderPath = path.join('/var/www/myapp/data', deviceId);

    // Make a new folder (if new device) for the device
    fs.mkdir(deviceFolderPath, { recursive: true }, (err) => {
        if (err) {
            return res.status(500).send('Server error');
        }

        // Create arrays for each datavalue
        const timeArray = [];
        const accxArray = [];
        const accyArray = [];
        const acczArray = [];
        const latArray = [];
        const lonArray = [];
        const vertAccArray = [];

        // Populate the arrays going through every entry of the data array
        data.forEach((entry) => {
            timeArray.push(entry.time);
            accxArray.push(entry.accx);
            accyArray.push(entry.accy);
            acczArray.push(entry.accz);
            latArray.push(entry.lat);
            lonArray.push(entry.lon);
            vertAccArray.push(entry.vertAcc);
        });

        // Get current date time in GMT + 2
        const date = new Date();
        date.setHours(date.getHours() + 2);

        // Create structured data object for JSON storage
        const structuredData = {
            received_at: date.toISOString(),
            time: timeArray,
            accx: accxArray,
            accy: accyArray,
            accz: acczArray,
            lat: latArray,
            lon: lonArray,
            vertAcc: vertAccArray
        };

        // Convert structuredData to JSON
        const jsonString = JSON.stringify(structuredData, null, 2);

        // Create a filename based on the current time
        const timestamp = date.toISOString().replace(/[:.]/g, '-');
        const jsonFilePath = path.join(deviceFolderPath, `${timestamp}.json`);
        const csvFilePath = path.join(deviceFolderPath, `${timestamp}.csv`);

        // Save the JSON file
        fs.writeFile(jsonFilePath, jsonString, (err) => {
            if (err) {
                res.status(500).send('Server error');
                return;
            }

            // Flatten the data so that it can be converted to .csv
            const flattenedData = [];
            for (let i = 0; i < timeArray.length; i++) {
                const dataPoint = {
                    time: timeArray[i],
                    accx: accxArray[i],
                    accy: accyArray[i],
                    accz: acczArray[i],
                    lat: latArray[i],
                    lon: lonArray[i],
                    vertAcc: vertAccArray[i]
                };
                flattenedData.push(dataPoint);
            }

            // Convert the flattened data in to a .csv file
            try {
                const fields = ['time', 'accx', 'accy', 'accz', 'lat', 'lon', 'vertAcc'];
                const json2csvParser = new Parser({ fields });
                const csv = json2csvParser.parse(flattenedData);

                // Save the .csv file
                fs.writeFile(csvFilePath, csv, (err) => {
                    if (err) {
                        return res.status(500).send('Server error');
                    }

                    // If no funny business unfolds
                    res.status(200).send('Data received and stored!');
                });
            } catch (err) {
                return res.status(500).send('Server error');
            }
        });
    });
});

// Return the current POST message
app.get('/get_message', (req, res) => {
    res.json({ message: postMessage || 'No POST request received yet.' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
});
