#!/usr/bin/env zsh

# Configuration

ip="$1"
last_digits="${ip##*.}"
api_key="100acresranch100acresranch100acr"
api_url_get_profiles="http://$ip/api/v1/autotune/presets"
api_url_set_profile="http://$ip/api/v1/settings"
top_threshold_file="/home/100acresranch/house/top-threshold.csv"
bottom_threshold_file="/home/100acresranch/house/bottom-threshold.csv"
top_profile_file="/home/100acresranch/house/tp${last_digits}.csv"
bottom_profile_file="/home/100acresranch/house/bp${last_digits}.csv"
voltage_file="/home/100acresranch/house/voltage.csv"
profiles_json="/home/100acresranch/house/house${last_digits}profiles.json"
on_file="/home/100acresranch/house/on.csv"
off_file="/home/100acresranch/house/off.csv"
pools_file="/home/100acresranch/house/pools.json"

# Initialize old_profile with a value that won't match any real profile value
old_profile=-1

on=1

# Main loop
while true; do
	# Load the current voltage, top, and bottom thresholds
	voltage=$(awk -F, '{print $NF}' "$voltage_file" | tail -n 1)
	top_threshold=$(<"$top_threshold_file")
	bottom_threshold=$(<"$bottom_threshold_file")
	top_profile=$(<"$top_profile_file")
	bottom_profile=$(<"$bottom_profile_file")
	off_threshold=$(<"$off_file")
	on_threshold=$(<"$on_file")
	pools=$(<"$pools_file")

	if (( $(echo "$voltage < $off_threshold" | bc -l) )); then
		curl -L -s -X 'POST' \
			'http://$ip/api/v1/mining/stop' \
			-H 'accept: */*' \
			-H 'x-api-key: 100acresranch100acresranch100acr' \
			-d ''
		on=0
		echo "stopped" > ${ip}.current_profile
		sleep 100
		continue
	fi
	if [[ $(echo "$voltage > $on_threshold" | bc -l) -eq 1 ]]; then
		curl -X 'POST' \
			'http://$ip/api/v1/mining/start' \
			-H 'accept: */*' \
			-H 'x-api-key: 100acresranch100acresranch100acr' \
			-d ''
		on=1
	fi
	if (( $on == 1 )); then
		# Fetch presets
		curl -L -s -X 'GET' \
			"$api_url_get_profiles" \
			-H 'accept: application/json' \
			-H "x-api-key: $api_key" > "$profiles_json"


		# Parse and sort profiles by name assuming the names are numeric
		profiles_sorted=($(jq -r '[.[] | select(.name | test("^[0-9]+"))] | sort_by(.name | tonumber) | .[].name' "$profiles_json"))

		if [[ -z "${profiles_sorted[*]}" ]]; then
			echo "No valid profiles found. Please check the presets."
	    		sleep 100  # Short delay before the next iteration
	    		continue
    		fi

    		# Identify indices for tp and bp within the sorted array
    		tp_index=$(printf "%s\n" "${profiles_sorted[@]}" | grep -nx "$top_profile" | cut -d: -f1)
    		bp_index=$(printf "%s\n" "${profiles_sorted[@]}" | grep -nx "$bottom_profile" | cut -d: -f1)
    		# Determine the profile based on voltage and thresholds
    		if (( $(echo "$voltage > $top_threshold" | bc -l) )); then
			current_profile=$top_profile  # Enforce use of the specified top profile
    		elif (( $(echo "$voltage < $bottom_threshold" | bc -l) )); then
			current_profile=$bottom_profile  # Use the specified bottom profile
    		else
	    		# Calculate ratio for intermediate voltages, adjusting for the subrange between bp and tp
	    		subrange_size=$((tp_index - bp_index))
	    		ratio=$(echo "scale=12; ($voltage - $bottom_threshold) / ($top_threshold - $bottom_threshold)" | bc -l)
	    		index=$(echo "$ratio * $subrange_size" | bc -l)
	    		index=$(printf "%.0f" "$index")  # Round to nearest whole number
	    		index=$((index + bp_index - 1))  # Adjust index based on bp position

			# Ensure index is within the subrange defined by tp and bp
			(( index < bp_index )) && index=$bp_index
			(( index > tp_index )) && index=$tp_index

			current_profile=${profiles_sorted[index-1]}  # Select profile based on index
    		fi

    		# Apply the profile if it has changed
    		if [[ "$old_profile" != "$current_profile" && -n "$current_profile" ]]; then
	    		echo "Changing profile to $current_profile."
	    		curl -L -s -X 'POST' \
		    		"$api_url_set_profile" \
		    		-H 'accept: application/json' \
		    		-H "x-api-key: $api_key" \
		    		-H 'Content-Type: application/json' \
                                -d "{\"miner\": {\"overclock\": {\"modded_psu\": false, \"preset\": \"$current_profile\"}}, \"pools\": $pools}"
	    		if [ $? -eq 0 ]; then
			    old_profile="$current_profile"
			    echo "$current_profile" > ${ip}.current_profile
			fi
    		else
	    		echo "Profile remains at $current_profile; no change required."
    		fi
	fi
	sleep 100  # Short delay before the next iteration
done
