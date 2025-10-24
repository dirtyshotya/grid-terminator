#!/bin/bash

# Path to the Python script
PYTHON_SCRIPT="/home/100acresranch/voltage.py"
# Output CSV file
OUTPUT_CSV="/home/100acresranch/house/voltage.csv"
# Lock file for ensuring atomic writes
LOCK_FILE="/tmp/voltage.lock"

# Ensure the lock file exists
touch "$LOCK_FILE"

# Function to take a sample
take_sample() {
    python3 "$PYTHON_SCRIPT"
}

# Run continuously
while true; do
    # Array to store the samples
    samples=()

    # Take 10 samples over 10 seconds
    for i in {1..10}; do
        sample=$(take_sample)
        samples+=("$sample")
        
        # Sleep for 1 second between samples if not on the last iteration
        if [ $i -lt 10 ]; then
            sleep 1
        fi
    done

    # Calculate the average of the samples
    total=0
    for sample in "${samples[@]}"; do
        total=$(echo "$total + $sample" | bc)
    done
    average=$(echo "scale=12; $total / ${#samples[@]}" | bc)

    # Use flock to ensure atomic write to the CSV file
    (
        flock -x 200
	echo "$(TZ='America/Denver' date '+%Y-%m-%d %H:%M:%S'),$average" >> "$OUTPUT_CSV"
    ) 200>"$LOCK_FILE"
done

