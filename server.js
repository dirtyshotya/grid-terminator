const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' directory

// Wi-Fi configuration endpoint
app.post('/configure-wifi', (req, res) => {
    const { ssid, password } = req.body;

    // Save the Wi-Fi configuration (you can write to a file or update the system configuration here)
    const config = { ssid, password };

    fs.writeFile('/home/100acresranch/house/wifi-config.json', JSON.stringify(config), (err) => {
        if (err) {
            console.error('Error saving Wi-Fi configuration:', err);
            res.status(500).json({ success: false });
        } else {
            res.json({ success: true });
        }
    });
});

// Define the endpoint /asicN where N is a number between 1 and 10
app.get('/asic:asicId(\\d+)', async (req, res) => {
    const { asicId } = req.params;

    // Validate ASIC ID is within the range
    if (asicId < 1 || asicId > 10) {
        return res.status(400).send('ASIC ID must be between 1 and 10.');
    }

    try {
        // Read the IP address from the file
        const filePath = path.join('/home/100acresranch/house', `asic${asicId}.ip`);
        const ipAddress = fs.readFileSync(filePath, 'utf8').trim();

        // Make the API request
        const apiUrl = `http://${ipAddress}/api/v1/summary`;
        const response = await axios.get(apiUrl, {
            headers: {
                'accept': 'application/json',
                'x-api-key': '100acresranch100acresranch100acr'
            },
            timeout: 10000 // Set timeout to 10 seconds
        });

        // Extract data to display
        const minerData = response.data.miner;
        const { miner_type, average_hashrate, instant_hashrate } = minerData;
        const current_profile = fs.readFileSync(path.join('/home/100acresranch/house', `${ipAddress}.current_profile`), 'utf8').trim();

        // Construct the HTML content
        const htmlResponse = `
            <div style="width: 400px; height: 400px; border-radius: 50%; background-color: rgba(0, 0, 0, 0.7); color: lightseagreen; text-shadow: 0 0 5px magenta, 0 0 10px magenta, 0 0 15px magenta; display: flex; align-items: center; justify-content: center;">
                <div>
                    <p>Type:<br>${miner_type}</p>
                    <p>IP: ${ipAddress}</p>
                    <p>Average Hashrate:<br>${average_hashrate} TH/s</p>
                    <p>Instant Hashrate:<br>${instant_hashrate} TH/s</p>
                    <p>Current Profile:<br>${current_profile} W</p>
                </div>
            </div>
        `;

        res.send(htmlResponse);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Failed to fetch ASIC data.');
    }
});

app.post('/multiplier', (req, res) => {
    fs.writeFileSync('/home/100acresranch/house/multiplier.csv', req.body.multiplier);
    res.send('Multiplier updated to ' + req.body.multiplier);
});

app.post('/submit-pools', (req, res) => {
    const pools = [];

    // Adding pool 1 (required fields)
    pools.push({
        url: req.body.url1,
        user: req.body.user1 || "",
        pass: req.body.pass1 || ""
    });

    // Adding pool 2 (optional fields)
    if (req.body.url2 || req.body.user2 || req.body.pass2) {
        pools.push({
            url: req.body.url2 || "",
            user: req.body.user2 || "",
            pass: req.body.pass2 || ""
        });
    }

    // Adding pool 3 (optional fields)
    if (req.body.url3 || req.body.user3 || req.body.pass3) {
        pools.push({
            url: req.body.url3 || "",
            user: req.body.user3 || "",
            pass: req.body.pass3 || ""
        });
    }

    fs.writeFile('pools.json', JSON.stringify(pools), (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error writing to file');
        } else {
            res.send('Credentials saved successfully!');
        }
    });
});

const updateThreshold = (filePath, multiplier, threshold, res) => {
    try {
        fs.writeFileSync(filePath, String(Number(threshold) / multiplier));
        res.send('Shared threshold updated successfully.');
    } catch (error) {
        console.error(`Error updating threshold: ${error}`);
        res.status(500).send('Error updating threshold.');
    }
};

// Shared Threshold Update
app.post('/update-top-threshold', (req, res) => {
    const multiplier = parseFloat(fs.readFileSync('/home/100acresranch/house/multiplier.csv', 'utf8').trim());
    updateThreshold('/home/100acresranch/house/top-threshold.csv', multiplier, req.body.threshold, res);
});

app.post('/update-bottom-threshold', (req, res) => {
    const multiplier = parseFloat(fs.readFileSync('/home/100acresranch/house/multiplier.csv', 'utf8').trim());
    updateThreshold('/home/100acresranch/house/bottom-threshold.csv', multiplier, req.body.threshold, res);
});

app.post('/update-on-threshold', (req, res) => {
    const multiplier = parseFloat(fs.readFileSync('/home/100acresranch/house/multiplier.csv', 'utf8').trim());
    updateThreshold('/home/100acresranch/house/on.csv', multiplier, req.body.threshold, res);
});

app.post('/update-off-threshold', (req, res) => {
    const multiplier = parseFloat(fs.readFileSync('/home/100acresranch/house/multiplier.csv', 'utf8').trim());
    updateThreshold('/home/100acresranch/house/off.csv', multiplier, req.body.threshold, res);
});

// Device Configuration Update
const updateDeviceConfig = (filePath, data, res) => {
    try {
        fs.writeFileSync(filePath, data);
        res.send('Configuration updated successfully.');
    } catch (error) {
        console.error(`Error updating device configuration: ${error}`);
        res.status(500).send('Error updating configuration.');
    }
};

// Define routes for device configurations
app.post('/update-tp-21', (req, res) => updateDeviceConfig('/home/100acresranch/house/tp21.csv', req.body.tp, res)); // Add this line
app.post('/update-bp-21', (req, res) => updateDeviceConfig('/home/100acresranch/house/bp21.csv', req.body.bp, res)); // Add this line
app.post('/update-tp-24', (req, res) => updateDeviceConfig('/home/100acresranch/house/tp24.csv', req.body.tp, res));
app.post('/update-bp-24', (req, res) => updateDeviceConfig('/home/100acresranch/house/bp24.csv', req.body.bp, res));
app.post('/update-tp-25', (req, res) => updateDeviceConfig('/home/100acresranch/house/tp25.csv', req.body.tp, res));
app.post('/update-bp-25', (req, res) => updateDeviceConfig('/home/100acresranch/house/bp25.csv', req.body.bp, res));
app.post('/update-tp-26', (req, res) => updateDeviceConfig('/home/100acresranch/house/tp26.csv', req.body.tp, res)); // Add this line
app.post('/update-bp-26', (req, res) => updateDeviceConfig('/home/100acresranch/house/bp26.csv', req.body.bp, res)); // Add this line
app.post('/update-tp-27', (req, res) => updateDeviceConfig('/home/100acresranch/house/tp27.csv', req.body.tp, res)); // Add this line
app.post('/update-bp-27', (req, res) => updateDeviceConfig('/home/100acresranch/house/bp27.csv', req.body.bp, res)); // Add this line

app.get('/voltage', (req, res) => {
    const multiplier = parseFloat(fs.readFileSync('/home/100acresranch/house/multiplier.csv', 'utf8').trim());
    const voltageFilePath = '/home/100acresranch/house/voltage.csv';

    fs.readFile(voltageFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Failed to read the file');
        }

        const lines = data.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const fields = lastLine.split(',');
        const time = fields[0];
        const voltage = (fields[1] * multiplier).toFixed(3);

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Voltage Display</title>
  <style>
    body, html {
      height: 100%;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: transparent;
      text-shadow: 0 0 5px magenta, 0 0 10px magenta, 0 0 15px magenta;
    }
    .voltage-display {
      width: 200px;
      height: 200px;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-size: 24px;
      color: lightseagreen;
      background: linear-gradient(to right, rgba(0, 0, 0, 0.7) 50%, transparent 50%);
      background-size: 200% 100%;
      border-radius: 50%;
      box-shadow: 0 0 10px magenta, 0 0 20px magenta, 0 0 30px magenta;
    }
  </style>
</head>
<body>
  <div class="voltage-display">
    <h1>${voltage}V</h1>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const voltageData = ${JSON.stringify({time, voltage})};
      console.log('Voltage Data:', voltageData);
    });
  </script>
</body>
</html>
        `;
        res.send(htmlContent);
    });
});

// Serve IPS.html from the public directory
app.get('/ips.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ips.html'));
});

// Define a route to handle POST requests to "/ips"
app.post('/ips', (req, res) => {
    const { ip, index } = req.body;
    const filePath = path.join('/home/100acresranch/house', `asic${index}.ip`);
    console.log(`Received IP: ${ip} at index: ${index}`);
    try {
        fs.writeFileSync(filePath, ip);
        console.log(`Saved IP: ${ip} to file: ${filePath}`);
        res.send(`Received and saved IP: ${ip} at index: ${index}`);
    } catch (error) {
        console.error(`Error saving IP to file: ${error}`);
        res.status(500).send('Failed to save IP address.');
    }
});

// Endpoint to submit IP address
app.post('/submit-ip', (req, res) => {
    const ip = req.body.ip;
    // Save IP address to ip.csv
    fs.writeFileSync('/home/100acresranch/house/asic1.ip', ip);
    res.send('IP address saved successfully');
});

app.post('/submit-ip2', (req, res) => {
    const ip = req.body.ip;
    // Save IP address to ip.csv
    fs.writeFileSync('/home/100acresranch/house/asic2.ip', ip);
    res.send('IP address 2 saved successfully');
});

app.post('/submit-ip3', (req, res) => {
    const ip = req.body.ip;
    // Save IP address to ip.csv
    fs.writeFileSync('/home/100acresranch/house/asic3.ip', ip);
    res.send('IP address 3 saved successfully');
});

app.post('/submit-ip4', (req, res) => {
    const ip = req.body.ip;
    // Save IP address to ip.csv
    fs.writeFileSync('/home/100acresranch/house/asic4.ip', ip);
    res.send('IP address 4 saved successfully');
});

app.post('/submit-ip5', (req, res) => {
    const ip = req.body.ip;
    // Save IP address to ip.csv
    fs.writeFileSync('/home/100acresranch/house/asic5.ip', ip);
    res.send('IP address 5 saved successfully');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
});
