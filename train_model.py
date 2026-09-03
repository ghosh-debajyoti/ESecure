import pandas as pd
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
import torch
import evaluate
import numpy as np
import os

def compute_metrics(eval_pred):
    metric = evaluate.load("accuracy")
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    return metric.compute(predictions=predictions, references=labels)

def main():
    # 1. Load dataset
    data_path = "data/phishing_email_dataset.csv"
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please download it first.")
        
    df = pd.read_csv(data_path)
    
    # Fill NaN values in subject and body with empty strings
    if 'subject' in df.columns:
        df['subject'] = df['subject'].fillna("")
    if 'body' in df.columns:
        df['body'] = df['body'].fillna("")
        
    # Create a combined text column
    if 'subject' in df.columns and 'body' in df.columns:
        df['text'] = df['subject'] + " " + df['body']
    elif 'body' in df.columns:
        df['text'] = df['body']
    elif 'text_combined' in df.columns:
        df['text'] = df['text_combined']
    
    # Drop rows where the combined text is empty
    df = df[df['text'].str.strip() != ""]
    df = df.dropna(subset=['text', 'label'])
    
    # Sample a small subset for fast hackathon local training
    if len(df) > 2000:
        df = df.sample(n=2000, random_state=42)

    text_col = 'text'
    label_col = 'label'
    print(f"Using text column: '{text_col}' and label column: '{label_col}'")

    # Ensure label is int
    df[label_col] = df[label_col].astype(int)

    # 80/20 split
    train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)

    # Convert to Hugging Face Dataset
    train_dataset = Dataset.from_pandas(train_df)
    test_dataset = Dataset.from_pandas(test_df)

    # 2. Tokenization & Model
    model_name = "distilbert-base-uncased"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

    def tokenize_function(examples):
        return tokenizer(examples[text_col], padding="max_length", truncation=True, max_length=512)

    train_dataset = train_dataset.map(tokenize_function, batched=True)
    test_dataset = test_dataset.map(tokenize_function, batched=True)

    # Rename label column if needed
    if label_col != "label":
        train_dataset = train_dataset.rename_column(label_col, "labels")
        test_dataset = test_dataset.rename_column(label_col, "labels")
    else:
        # Hugging Face expects the target to be named 'labels'.
        train_dataset = train_dataset.rename_column("label", "labels")
        test_dataset = test_dataset.rename_column("label", "labels")
        
    train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])
    test_dataset.set_format("torch", columns=["input_ids", "attention_mask", "labels"])

    # 3. Training Configuration
    # Use evaluation_strategy for older transformers versions to be safe, eval_strategy is for >= 4.41
    training_args = TrainingArguments(
        output_dir="./results",
        eval_strategy="epoch",  
        learning_rate=2e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=2,
        weight_decay=0.01,
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="accuracy",
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        processing_class=tokenizer,
        compute_metrics=compute_metrics,
    )

    # Train
    print("Starting training...")
    trainer.train()

    # Save best model
    save_path = "./saved_phishing_model"
    model.save_pretrained(save_path)
    tokenizer.save_pretrained(save_path)
    print(f"Model and tokenizer saved to {save_path}")

if __name__ == "__main__":
    main()
