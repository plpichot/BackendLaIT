import json
from nptdms import TdmsFile

def tdms_to_json(tdms_file_path, json_file_path):
    tdms_file = TdmsFile.read(tdms_file_path)
    data = {}
    
    channels = [channel for group in tdms_file.groups() for channel in group.channels()]
    group_data = [group.properties for group in tdms_file.groups()]

    for properties in group_data:
        for key, value in properties.items():
            data[key] = value
    
    samples = []
    for i in range(500):
        sample_data = {}
        for channel in channels:
            sample_data[channel.name] = channel[i]
        samples.append(sample_data)

    data['Data'] = samples

    with open(json_file_path, 'w') as json_file:
        json.dump(data, json_file)