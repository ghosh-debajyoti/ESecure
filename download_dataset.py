import kagglehub
import shutil
import os

path = kagglehub.dataset_download("naserabdullahalam/phishing-email-dataset")
print("Path to dataset files:", path)

# Find the csv file inside the path
for file in os.listdir(path):
    if file.endswith(".csv"):
        csv_path = os.path.join(path, file)
        os.makedirs("data", exist_ok=True)
        shutil.copy(csv_path, "data/phishing_email_dataset.csv")
        print("Copied dataset to data/phishing_email_dataset.csv")
        break
