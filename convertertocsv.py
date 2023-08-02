import csv
from nptdms import TdmsFile

def tdms_to_csv(tdms_file_path, csv_file_path):
    tdms_file = TdmsFile.read(tdms_file_path)
    data = []
    
    channels = [channel for group in tdms_file.groups() for channel in group.channels()]

    for i in range(500):
        sample_data = {}
        for channel in channels:
            sample_data[channel.name] = channel[i]
        data.append(sample_data)

    with open(csv_file_path, 'w', newline='') as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)