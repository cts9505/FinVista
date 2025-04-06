import os
import json
import re
import datetime
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Get API key from environment variables
API_KEY = os.getenv('API_KEY')
if not API_KEY:
    raise ValueError("API_KEY environment variable not set")

# Configure Google Generative AI
genai.configure(api_key=API_KEY)

app = FastAPI(title="Google Pay OCR API")

# Add CORS middleware to allow requests from Node.js client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OCRResponse(BaseModel):
    transactions: list
    count: int
    raw_text: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "Google Pay OCR API is running"}

@app.post("/process-image/", response_model=OCRResponse)
async def process_image(file: UploadFile = File(...), include_raw_text: bool = False):
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="File must be an image (PNG, JPG, JPEG)")
    
    try:
        # Save the uploaded file temporarily
        temp_file_path = f"temp_{file.filename}"
        with open(temp_file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Process the image
        try:
            sample_file = prep_image(temp_file_path)
            
            # Extract text from image using Google Gemini
            extracted_text = extract_text_from_image(sample_file, "Extract the text in the image verbatim")
            
            # Process the extracted text into JSON
            transactions = process_ocr_to_json_multiple(extracted_text)
            
            # Prepare response
            response = {
                "transactions": transactions,
                "count": len(transactions)
            }
            
            if include_raw_text:
                response["raw_text"] = extracted_text
            
            return response
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")

def prep_image(image_path):
    """Upload the image to Google Generative AI API"""
    try:
        sample_file = genai.upload_file(path=image_path, display_name="GPay Receipt")
        return sample_file
    except Exception as e:
        raise Exception(f"Failed to upload image: {str(e)}")

def extract_text_from_image(image_file, prompt):
    """Extract text from image using Google Gemini"""
    try:
        model = genai.GenerativeModel(model_name="gemini-1.5-pro")
        response = model.generate_content([image_file, prompt])
        return response.text
    except Exception as e:
        raise Exception(f"Text extraction failed: {str(e)}")

def process_ocr_to_json_multiple(extracted_text):
    """Process OCR text into structured JSON data"""
    # List to hold all transactions
    transactions = []
    
    # List of months to exclude from titles
    months = ["January", "February", "March", "April", "May", "June", 
              "July", "August", "September", "October", "November", "December"]
    
    # Split the text by lines
    lines = extracted_text.strip().split('\n')
    
    # Regular expressions
    name_amount_pattern = r'^([A-Z][^₹]+)₹(\d+(?:\.\d{2})?)$'  # Matches name and amount on same line
    name_pattern = r'^([A-Z][^\d₹]+)$'  # Matches lines that start with capital letter and don't have numbers/₹
    amount_pattern = r'₹(\d+(?:,\d+)*(?:\.\d{2})?)$'  # Matches amount at end of line
    date_pattern = r'(\d{1,2}\s+[A-Za-z]+)'  # Matches date like "1 April"
    monthly_summary_pattern = r'\*\*[A-Za-z]+\*\*\s+\+\s+₹[\d,.]+'  # Matches lines like "**April** + ₹7,925"
    header_pattern = r'Status|Payment method|Date|^\d{4}$'  # Matches header lines and year lines
    
    # Processing variables
    current_name = ""
    current_amount = 0
    current_date = ""
    current_type = "expense"
    
    # Track if we're in a transaction
    in_transaction = False
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip header and monthly summary lines
        if (re.search(header_pattern, line) or 
            re.search(monthly_summary_pattern, line)):
            i += 1
            continue
        
        # Check if line has both name and amount
        name_amount_match = re.search(name_amount_pattern, line)
        if name_amount_match:
            # If we were in a transaction, save it first
            if in_transaction and current_name and current_amount > 0:
                # Only add if title is not a month
                if not any(month.lower() == current_name.strip().lower() for month in months):
                    transactions.append({
                        "title": current_name.strip(),
                        "amount": current_amount,
                        "category": "Google Pay",
                        "description": "payment successful",
                        "date": current_date if current_date else "unknown",
                        "type": current_type
                    })
            
            # Start new transaction
            current_name = name_amount_match.group(1).strip()
            current_amount = float(name_amount_match.group(2))
            current_type = "expense"  # Default
            current_date = ""
            in_transaction = True
            
            # Look ahead for date on next line
            if i+1 < len(lines) and re.search(date_pattern, lines[i+1]):
                date_match = re.search(date_pattern, lines[i+1])
                if date_match:
                    date_str = date_match.group(1)
                    try:
                        parsed_date = datetime.datetime.strptime(date_str, "%d %B")
                        current_year = datetime.datetime.now().year
                        parsed_date = parsed_date.replace(year=current_year)
                        current_date = parsed_date.isoformat()
                    except Exception as e:
                        print(f"Date parsing error: {e}")
                        current_date = "unknown"
                i += 1  # Skip the date line as we've processed it
        
        # Check if line is just a name (might be continued on next line)
        elif re.search(name_pattern, line):
            # If we were in a transaction, save it first
            if in_transaction and current_name and current_amount > 0:
                # Only add if title is not a month
                if not any(month.lower() == current_name.strip().lower() for month in months):
                    transactions.append({
                        "title": current_name.strip(),
                        "amount": current_amount,
                        "category": "Google Pay",
                        "description": "payment successful",
                        "date": current_date if current_date else "unknown",
                        "type": current_type
                    })
            
            # Start a potential new transaction
            current_name = line
            current_amount = 0
            current_type = "expense"  # Default
            current_date = ""
            in_transaction = True
            
            # Check if next line has amount or is continuation of name
            if i+1 < len(lines):
                next_line = lines[i+1].strip()
                amount_match = re.search(amount_pattern, next_line)
                if amount_match:
                    current_amount = float(amount_match.group(1).replace(',', ''))
                    # Check if it's income (has + sign)
                    if '+' in next_line:
                        current_type = "income"
                    i += 1  # Skip as we've processed it
                elif not re.search(date_pattern, next_line) and not re.search(header_pattern, next_line):
                    # It's probably continuation of the name
                    current_name += " " + next_line
                    i += 1  # Skip as we've processed it
            
            # Look ahead for date
            if i+1 < len(lines) and re.search(date_pattern, lines[i+1]):
                date_match = re.search(date_pattern, lines[i+1])
                if date_match:
                    date_str = date_match.group(1)
                    try:
                        parsed_date = datetime.datetime.strptime(date_str, "%d %B")
                        current_year = datetime.datetime.now().year
                        parsed_date = parsed_date.replace(year=current_year)
                        current_date = parsed_date.isoformat()
                    except Exception as e:
                        print(f"Date parsing error: {e}")
                        current_date = "unknown"
                i += 1  # Skip the date line as we've processed it
        
        # Check if line has just amount
        elif re.search(amount_pattern, line) and current_name:
            amount_match = re.search(amount_pattern, line)
            if amount_match:
                current_amount = float(amount_match.group(1).replace(',', ''))
                # Check if it's income (has + sign)
                if '+' in line:
                    current_type = "income"
        
        # Check if line has date
        elif re.search(date_pattern, line):
            date_match = re.search(date_pattern, line)
            if date_match:
                date_str = date_match.group(1)
                try:
                    parsed_date = datetime.datetime.strptime(date_str, "%d %B")
                    current_year = datetime.datetime.now().year
                    parsed_date = parsed_date.replace(year=current_year)
                    current_date = parsed_date.isoformat()
                except Exception as e:
                    print(f"Date parsing error: {e}")
                    current_date = "unknown"
            
            # End of transaction, save it if we have name and amount
            if in_transaction and current_name and current_amount > 0:
                # Only add if title is not a month
                if not any(month.lower() == current_name.strip().lower() for month in months):
                    transactions.append({
                        "title": current_name.strip(),
                        "amount": current_amount,
                        "category": "Google Pay",
                        "description": "payment successful",
                        "date": current_date if current_date else "unknown",
                        "type": current_type
                    })
                in_transaction = False
                current_name = ""
                current_amount = 0
                current_date = ""
        
        i += 1
    
    # Add the last transaction if it exists
    if in_transaction and current_name and current_amount > 0:
        # Only add if title is not a month
        if not any(month.lower() == current_name.strip().lower() for month in months):
            transactions.append({
                "title": current_name.strip(),
                "amount": current_amount,
                "category": "Google Pay",
                "description": "payment successful",
                "date": current_date if current_date else "unknown",
                "type": current_type
            })
    
    return transactions

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)