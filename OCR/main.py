import google.generativeai as genai
import os
import json
import re
from dotenv import load_dotenv
load_dotenv()

# Replace 'your_api_key' with your actual Google API key
API_KEY = os.getenv("API_KEY")
genai.configure(api_key=API_KEY)

def prep_image(image_path):
    # Upload the file and print a confirmation.
    sample_file = genai.upload_file(path=image_path,
                                display_name="Transaction Image")
    print(f"Uploaded file '{sample_file.display_name}' as: {sample_file.uri}")
    file = genai.get_file(name=sample_file.name)
    print(f"Retrieved file '{file.display_name}' as: {sample_file.uri}")
    return sample_file

def extract_text_from_image(image_path, prompt):
    # Choose a Gemini model.
    model = genai.GenerativeModel(model_name="gemini-1.5-pro")
    # Prompt the model with text and the previously uploaded image.
    response = model.generate_content([image_path, prompt])
    return response.text

# List of month names to be ignored
MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 
          'august', 'september', 'october', 'november', 'december',
          'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

def parse_transaction_data(text):
    # Initialize an empty list to store transaction dictionaries
    transactions = []
    
    # Split text into lines
    lines = text.strip().split('\n')
    
    for line in lines:
        # Skip empty lines
        if not line.strip():
            continue
        
        # Skip lines that are monthly summaries (year + month name)
        if re.search(r'\b20\d{2}\b', line) and any(month.lower() in line.lower() for month in MONTHS):
            continue
            
        # Create a transaction dictionary with fields in the desired order
        transaction = {}
        
        # Check for '+' symbol anywhere in the line (for credit status)
        is_credited = '+' in line
        
        # Clean line by removing + for name extraction
        clean_line = line.replace('+', '')
        
        # Extract the name/title - exclude any single letter at the beginning
        name_match = re.search(r'^(?:[A-Z]\s)?((?:[A-Z][a-zA-Z]*(?:\s[A-Za-z]+)*)+)', clean_line)
        if name_match:
            transaction['name'] = name_match.group(1).strip()
        else:
            # If that pattern didn't work, try to extract any capitalized words
            name_match = re.search(r'([A-Z][a-zA-Z]*(?:\s[A-Za-z]+)*)', clean_line)
            if name_match:
                transaction['name'] = name_match.group(1).strip()
            else:
                transaction['name'] = "Unknown"
        
        # Extract date information (e.g., "1 April" or "31 March")
        date_match = re.search(r'(\d{1,2}\s(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))', clean_line, re.IGNORECASE)
        if date_match:
            transaction['date'] = date_match.group(1)
        else:
            transaction['date'] = "Unknown"
        
        # Extract the amount (any number with optional commas and decimal places)
        amount_match = re.search(r'(₹\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d{1,3}(?:,\d{3})*(?:\.\d+)?)', line)
        if amount_match:
            # Keep the original format with commas
            amount = amount_match.group(1)
            # Add the ₹ symbol if it's not present
            if not amount.startswith('₹'):
                amount = '₹' + amount
            transaction['amount'] = amount
        else:
            continue  # Skip if no amount found
        
        # Set the status based on '+' presence
        transaction['status'] = 'credited' if is_credited else 'debited'
        
        # Check for 'Failed' status indicator
        if 'failed' in line.lower():
            transaction['status'] = 'failed'
        
        # Extract any emojis from the line
        emoji_pattern = re.compile("["
                               u"\U0001F600-\U0001F64F"  # emoticons
                               u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                               u"\U0001F680-\U0001F6FF"  # transport & map symbols
                               u"\U0001F700-\U0001F77F"  # alchemical symbols
                               u"\U0001F780-\U0001F7FF"  # Geometric Shapes
                               u"\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
                               u"\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
                               u"\U0001FA00-\U0001FA6F"  # Chess Symbols
                               u"\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
                               u"\U00002702-\U000027B0"  # Dingbats
                               u"\U000024C2-\U0001F251" 
                               u"\U00002600-\U000026FF"  # Miscellaneous Symbols
                               u"\U00002700-\U000027BF"  # Dingbats
                               u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                               "]+", flags=re.UNICODE)
        
        emojis = emoji_pattern.findall(line)
        if emojis:
            transaction['emoji'] = ''.join(emojis)
            
        transactions.append(transaction)
    
    return transactions

def save_to_json(transactions, output_file='transactions.json'):
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(transactions, f, indent=4, ensure_ascii=False)  # ensure_ascii=False to preserve emojis
    print(f"Transaction data saved to {output_file}")

# Main execution
def main():
    image_path = 'test2.jpg'
    sample_file = prep_image(image_path) 
    
    # Use a more specific prompt to guide the model
    prompt = """
    Extract all transaction information from this image, including dates, any emojis, and failed status.
    For each transaction line, identify:
    1. The person/business name
    2. The transaction date (e.g., "1 April", "31 March")
    3. The transaction amount (with ₹ symbol)
    4. Whether it's a credit (+) or debit
    5. Any status indicators like "Failed"
    
    IGNORE any entries that are just year+month headers (like "2025 April" or "2025 March").
    """
    
    text = extract_text_from_image(sample_file, prompt)
    
    if text:
        print("Extracted Text:")
        print(text)
        
        # Parse the extracted text into structured transaction data
        transactions = parse_transaction_data(text)
        
        if transactions:
            # Save to JSON file
            save_to_json(transactions, 'transactions.json')
            print(f"Processed {len(transactions)} transactions")
        else:
            print("No valid transaction data found in the extracted text.")
    else:
        print("Failed to extract text from the image.")

if __name__ == "__main__":
    main()