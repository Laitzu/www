const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

// Define the directory containing JSON files
const jsonDir = '/var/www/myapp/data/57a006468d4ac8f8'; // Adjust this path as needed

// Function to convert a JSON file to CSV
function convertJsonToCsv(filePath) {
    // Read JSON file
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading JSON file ${filePath}:`, err);
            return;
        }

        try {
            const jsonData = JSON.parse(data);

            // Flatten data if structured with arrays for each attribute
            const flattenedData = [];
            const timeArray = jsonData.time || [];
            const accxArray = jsonData.accx || [];
            const accyArray = jsonData.accy || [];
            const acczArray = jsonData.accz || [];
            const latArray = jsonData.lat || [];
            const lonArray = jsonData.lon || [];
            const vertAccArray = jsonData.vertAcc || [];

            // Assuming all arrays are the same length, otherwise handle data alignment
            for (let i = 0; i < timeArray.length; i++) {
                const dataPoint = {
                    time: timeArray[i],
                    accx: accxArray[i],
                    accy: accyArray[i],
                    accz: acczArray[i],
                    lat: latArray[i],
                    lon: lonArray[i],
                    vertAcc: vertAccArray[i] || null
                };
                flattenedData.push(dataPoint);
            }

            // Define CSV fields
            const fields = ['time', 'accx', 'accy', 'accz', 'lat', 'lon', 'vertAcc'];
            const json2csvParser = new Parser({ fields });
            const csv = json2csvParser.parse(flattenedData);

            // Create the CSV file path
            const csvFilePath = filePath.replace('.json', '.csv');

            // Write CSV to a new file
            fs.writeFile(csvFilePath, csv, (err) => {
                if (err) {
                    console.error(`Error writing CSV file ${csvFilePath}:`, err);
                } else {
                    console.log(`CSV file created: ${csvFilePath}`);
                }
            });
        } catch (parseError) {
            console.error(`Error parsing JSON file ${filePath}:`, parseError);
        }
    });
}

// Read all JSON files in the specified directory and convert each to CSV
function convertAllJsonFilesInDirectory(directoryPath) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(directoryPath, file);

            // Check if file is a JSON file
            if (file.endsWith('.json')) {
                convertJsonToCsv(filePath);
            }
        });
    });
}

// Run the conversion on the specified directory
convertAllJsonFilesInDirectory(jsonDir);
