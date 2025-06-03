/**
 * CSV Utility Functions
 * 
 * This file contains utility functions for handling CSV import/export operations.
 */

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert to CSV
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @param excludeFields Fields to exclude from export (like 'id' for import templates)
 * @returns CSV string
 */
export const convertToCSV = (data: any[], headers?: string[], excludeFields?: string[]): string => {
  if (data.length === 0) {
    return '';
  }

  // If headers are not provided, use the keys from the first object
  let csvHeaders = headers || Object.keys(data[0]);
  
  // Exclude specified fields
  if (excludeFields) {
    csvHeaders = csvHeaders.filter(header => !excludeFields.includes(header));
  }
  
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
      } else if (value instanceof Date) {
        // Format dates as YYYY-MM-DD
        return value.toISOString().split('T')[0];
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
 * @param excludeFields Fields to exclude from export
 */
export const exportToCSV = (data: any[], filename: string, headers?: string[], excludeFields?: string[]): void => {
  // Convert data to CSV format
  const csvContent = convertToCSV(data, headers, excludeFields);
  
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
 * Export data for import template (excludes ID and other system fields)
 * @param data Array of objects to export
 * @param filename Name of the file to download
 * @param type Type of data being exported
 */
export const exportForImport = (data: any[], filename: string, type: 'clients' | 'services' | 'opportunities'): void => {
  // Define fields to exclude for each type
  const excludeFields = {
    clients: ['id', 'created_at', 'updated_at'],
    services: ['id', 'created_at', 'updated_at'],
    opportunities: ['id', 'created_at', 'updated_at', 'client_name', 'service_name', 'service_business_unit', 'assigned_user_name']
  };

  exportToCSV(data, filename, undefined, excludeFields[type]);
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
      console.warn(`Skipping row ${i+1}: incorrect number of values (expected ${headers.length}, got ${values.length})`);
      continue;
    }
    
    // Create an object from the headers and values
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      let value = values[index];
      
      // Try to convert to appropriate types
      if (value === '' || value === null || value === undefined) {
        obj[header] = null;
      } else if (value.includes(';')) {
        // Convert semicolon-separated strings back to arrays
        obj[header] = value.split(';').map(v => v.trim()).filter(v => v !== '');
      } else if (!isNaN(Number(value)) && value.trim() !== '' && !header.toLowerCase().includes('phone')) {
        // Convert numeric strings to numbers (but not phone numbers)
        obj[header] = Number(value);
      } else if (header.toLowerCase().includes('date') && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Keep date strings as-is if they're in YYYY-MM-DD format
        obj[header] = value;
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
 * @param type Type of data for specific validation rules
 * @returns Object with validation results
 */
export const validateCSVData = (
  data: any[], 
  requiredFields: string[], 
  type?: 'clients' | 'services' | 'opportunities'
): { valid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if data is empty
  if (data.length === 0) {
    errors.push('CSV file contains no data');
    return { valid: false, errors, warnings };
  }
  
  // Check for required fields in headers
  const headers = Object.keys(data[0]);
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      errors.push(`Required field "${field}" is missing from CSV headers`);
    }
  }
  
  // Check for ID field (should not be present for imports)
  if (headers.includes('id')) {
    warnings.push('ID field detected in CSV. This will be ignored during import as IDs are auto-generated.');
  }
  
  // If there are missing required fields, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }
  
  // Validate each row
  data.forEach((row, index) => {
    const rowNumber = index + 1;
    
    // Check required fields are not empty
    requiredFields.forEach(field => {
      const value = row[field];
      if (value === null || value === undefined || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        errors.push(`Row ${rowNumber}: Required field "${field}" is empty`);
      }
    });
    
    // Type-specific validations
    if (type === 'clients') {
      // Validate email format
      if (row.contact_email && !isValidEmail(row.contact_email)) {
        errors.push(`Row ${rowNumber}: Invalid email format for contact_email`);
      }
      
      // Validate account_owner_id is a number
      if (row.account_owner_id && isNaN(Number(row.account_owner_id))) {
        errors.push(`Row ${rowNumber}: account_owner_id must be a number`);
      }
      
      // Validate status
      const validStatuses = ['active', 'inactive', 'prospect'];
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push(`Row ${rowNumber}: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    } else if (type === 'services') {
      // Validate status
      const validStatuses = ['active', 'inactive', 'deprecated'];
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push(`Row ${rowNumber}: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Validate pricing_model
      const validPricingModels = ['Fixed Price', 'Hourly Rate', 'Retainer', 'Project-based', 'Commission', 'Value-based'];
      if (row.pricing_model && !validPricingModels.includes(row.pricing_model)) {
        warnings.push(`Row ${rowNumber}: Pricing model "${row.pricing_model}" is not in the standard list`);
      }
    } else if (type === 'opportunities') {
      // Validate IDs are numbers
      ['client_id', 'service_id', 'assigned_user_id'].forEach(field => {
        if (row[field] && isNaN(Number(row[field]))) {
          errors.push(`Row ${rowNumber}: ${field} must be a number`);
        }
      });
      
      // Validate estimated_value is a number
      if (row.estimated_value && isNaN(Number(row.estimated_value))) {
        errors.push(`Row ${rowNumber}: estimated_value must be a number`);
      }
      
      // Validate date format
      if (row.due_date && !row.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        errors.push(`Row ${rowNumber}: due_date must be in YYYY-MM-DD format`);
      }
      
      // Validate status
      const validStatuses = ['new', 'in_progress', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'];
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push(`Row ${rowNumber}: Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      // Validate priority
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      if (row.priority && !validPriorities.includes(row.priority)) {
        errors.push(`Row ${rowNumber}: Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Helper function to validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Prepare data for import by cleaning and transforming fields
 * @param data Raw CSV data
 * @param type Type of data being imported
 * @returns Cleaned data ready for import
 */
export const prepareDataForImport = (data: any[], type: 'clients' | 'services' | 'opportunities'): any[] => {
  return data.map(item => {
    // Remove system fields that shouldn't be imported
    const cleaned = { ...item };
    delete cleaned.id;
    delete cleaned.created_at;
    delete cleaned.updated_at;
    
    // Type-specific cleaning
    if (type === 'clients') {
      // Ensure services_used is an array of numbers
      if (cleaned.services_used) {
        if (typeof cleaned.services_used === 'string') {
          cleaned.services_used = cleaned.services_used.split(';').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id));
        } else if (Array.isArray(cleaned.services_used)) {
          cleaned.services_used = cleaned.services_used.map((id: any) => parseInt(String(id), 10)).filter((id: number) => !isNaN(id));
        }
      } else {
        cleaned.services_used = [];
      }
      
      // Ensure account_owner_id is a number
      if (cleaned.account_owner_id) {
        cleaned.account_owner_id = parseInt(String(cleaned.account_owner_id), 10);
      }
    } else if (type === 'services') {
      // Ensure applicable_industries is an array
      if (cleaned.applicable_industries) {
        if (typeof cleaned.applicable_industries === 'string') {
          cleaned.applicable_industries = cleaned.applicable_industries.split(';').map((industry: string) => industry.trim()).filter((industry: string) => industry !== '');
        }
      } else {
        cleaned.applicable_industries = [];
      }
    } else if (type === 'opportunities') {
      // Remove display fields that shouldn't be imported
      delete cleaned.client_name;
      delete cleaned.service_name;
      delete cleaned.service_business_unit;
      delete cleaned.assigned_user_name;
      
      // Ensure numeric fields are numbers
      ['client_id', 'service_id', 'assigned_user_id', 'estimated_value'].forEach(field => {
        if (cleaned[field]) {
          cleaned[field] = Number(cleaned[field]);
        }
      });
    }
    
    return cleaned;
  });
};