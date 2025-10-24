let multiplier; // Declare 'multiplier' at a higher scope

// Define a function to fetch and set the multiplier
function fetchAndSetMultiplier() {
    fetch('/multiplier.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            multiplier = parseFloat(data.trim()); // Parse and set the multiplier
            initializeConfigurations(); // Initialize configurations after multiplier is set
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
}

// Function to initialize configurations and fetch data
function initializeConfigurations() {
    const configurations = [
        { form: 'update-bottom-threshold', csv: 'bottom-threshold.csv', multiplier },
        { form: 'update-off-threshold', csv: 'off.csv', multiplier },
        { form: 'update-on-threshold', csv: 'on.csv', multiplier },
        { form: 'update-top-threshold', csv: 'top-threshold.csv', multiplier },
        // More configurations without a multiplier
        { form: 'update-bp-21', csv: 'bp21.csv' },
        { form: 'update-bp-24', csv: 'bp24.csv' },
        { form: 'update-bp-25', csv: 'bp25.csv' },
        { form: 'update-bp-26', csv: 'bp26.csv' },
        { form: 'update-bp-27', csv: 'bp27.csv' },
        { form: 'update-tp-21', csv: 'tp21.csv' },
        { form: 'update-tp-24', csv: 'tp24.csv' },
        { form: 'update-tp-25', csv: 'tp25.csv' },
        { form: 'update-tp-26', csv: 'tp26.csv' },
        { form: 'update-tp-27', csv: 'tp27.csv' },
        { form: 'multiplier', csv: 'multiplier.csv' }
    ];

    configurations.forEach(config => {
        fetchDataAndSetInput(config.form, config.csv, config.multiplier);
    });
}

// Function to fetch CSV and set input values
function fetchDataAndSetInput(formId, csvFile, multiplier) {
    fetch(csvFile)
        .then(response => response.text())
        .then(data => {
            let value = data.trim(); // Assuming single line/value in CSV
            if (multiplier) {
                value = (parseFloat(value) * multiplier).toFixed(3); // Now dividing by the multiplier
            }
            const formElement = document.querySelector(`form[action="/${formId}"] input[type="text"]`);
            if (formElement) {
                formElement.value = value;
            }
        })
        .catch(error => console.error('Error loading configuration:', error));
}

// Ensure everything starts after DOM is loaded
document.addEventListener('DOMContentLoaded', fetchAndSetMultiplier);

// Function to load pool data from JSON and populate the form
function loadPoolData() {
    fetch('/pools.json')
        .then(response => response.json())
        .then(pools => {
            pools.forEach((pool, index) => {
                const idx = index + 1; // Adjust index for form element IDs
                document.getElementById(`url${idx}`).value = pool.url || '';
                document.getElementById(`user${idx}`).value = pool.user || '';
                document.getElementById(`pass${idx}`).value = pool.pass || '';
            });
        })
        .catch(error => console.error('Failed to load pools data:', error));
}

// Call loadPoolData after the document has loaded
document.addEventListener('DOMContentLoaded', loadPoolData);

