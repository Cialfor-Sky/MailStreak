import sys
import os
import pandas as pd

# Add the project root to sys.path so app can be imported
sys.path.append(os.getcwd())

from app.ml.training import generate_synthetic_dataset

def export_data():
    output_file = "mailstreak_training_dataset.csv"
    print(f"Generating synthetic training dataset (2000 samples)...")
    
    # Generate the dataset using existing logic
    df = generate_synthetic_dataset(n=2000)
    
    # Save to CSV
    df.to_csv(output_file, index=False)
    print(f"Dataset successfully exported to: {output_file}")
    print(f"Summary of classes in dataset:")
    print(df['label'].value_counts())

if __name__ == "__main__":
    export_data()
