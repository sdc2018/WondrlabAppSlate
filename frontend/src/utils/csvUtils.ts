/**
 * CSV Utility Functions
 * 
 * This file contains utility functions for handling CSV import/export operations.
 */

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV string
 */
export const convertToCSV = (data: any[], headers?: string[]): string => {
  if (data.length === 0) {
    return '';
  }

  // If headers are not provided, use the keys from the first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create the header row
  let csvString = csvHeaders.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = csvHeaders.map(header => {
      // Get the value for this header
      const value = item[header];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if the value contains commas, quotes, or newlines
        const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
        const escapedValue = value.replace(/"/g, '""');
        return needsQuotes ? `"${escapedValue}"` : escapedValue;
      } else if (Array.isArray(value)) {
        // Convert arrays to semicolon-separated strings
        return `"${value.join(';')}"`;
      } else {
        // Convert other types to string
        return String(value);
      }
    }).join(',');
    
    csvString += row + '\n';
  });
  
  return csvString;
};

/**
 * Export data as a CSV file
 * @param data Array of objects to export
 * @param filename Name of the file to download
 * @param headers Optional custom headers
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[]): void => {
  // Convert data to CSV format
  const csvContent = convertToCSV(data, headers);
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  
  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add the link to the DOM
  document.body.appendChild(link);
  
  // Click the link to trigger the download
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parse a CSV file
 * @param file File object to parse
 * @returns Promise that resolves to an array of objects
 */
export const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const result = parseCSVText(csvText);
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : String(error)}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Parse CSV text into an array of objects
 * @param csvText CSV text to parse
 * @returns Array of objects
 */
export const parseCSVText = (csvText: string): any[] => {
  // Split the text into rows
  const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== '');
  
  if (rows.length === 0) {
    return [];
  }
  
  // Parse the header row
  const headers = parseCSVRow(rows[0]);
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const values = parseCSVRow(rows[i]);
    
    // Skip rows with incorrect number of values
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i+1}: incorrect number of values`);
      continue;
    }
    
    // Create an object from the headers and values
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Try to convert to appropriate types
      if (value === '') {
        obj[header] = null;
      } else if (value.includes(';')) {
        // Convert semicolon-separated strings back to arrays
        obj[header] = value.split(';').map(v => v.trim());
      } else if (!isNaN(Number(value)) && value.trim() !== '') {
        // Convert numeric strings to numbers
        obj[header] = Number(value);
      } else {
        obj[header] = value;
      }
    });
    
    data.push(obj);
  }
  
  return data;
};

/**
 * Parse a single CSV row, handling quoted values
 * @param row CSV row to parse
 * @returns Array of values
 */
const parseCSVRow = (row: string): string[] => {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = i < row.length - 1 ? row[i + 1] : null;
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Double quotes inside quotes represent a single quote
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle the inQuotes flag
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(currentValue);
      currentValue = '';
    } else {
      // Add character to current value
      currentValue += char;
    }
  }
  
  // Add the last value
  values.push(currentValue);
  
  return values;
};

/**
 * Validate CSV data against required fields
 * @param data Array of objects to validate
 * @param requiredFields Array of field names that must be present
 * @returns Object with validation results
 */
export const validateCSVData = (data: any[], requiredFields: string[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check if data is empty
  if (data.length === 0) {
    errors.push('CSV file contains no data');
    return { valid: false, errors };
  }
  
  // Check for required fields
  for (const field of requiredFields) {
    if (!(field in data[0])) {
      errors.push(`Required field "${field}" is missing`);
    }
  }
  
  // If there are missing fields, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Validate each row
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (row[field] === null || row[field] === undefined || row[field] === '') {
        errors.push(`Row ${index + 1}: Required field "${field}" is empty`);
      }
    });
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
