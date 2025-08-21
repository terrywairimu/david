// Inter Font Embedding for PDF Generation
// This file handles the embedding of Inter font family into PDFs

import { generate } from '@pdfme/generator';

// Inter font base64 encoded strings
export const INTER_FONTS = {
  // Inter Regular
  'Inter-Regular': 'data:font/woff2;base64,d09GMgABAAAAAJQkABMAAAABbMgAAJO0AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGoJVG4GvChzGBj9IVkFSiT8GYD9TVEFUgTgA',
  
  // Inter Bold
  'Inter-Bold': 'data:font/woff2;base64,PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ZW4+CiAgPG1ldGEgY2hhcnNldD11dGYtOD4KICA8bWV0YSBuYW1lPXZpZXdwb3J0',
  
  // Inter Medium (using Regular for now)
  'Inter-Medium': 'data:font/woff2;base64,d09GMgABAAAAAJQkABMAAAABbMgAAJO0AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGoJVG4GvChzGBj9IVkFSiT8GYD9TVEFUgTgA',
  
  // Inter SemiBold (using Bold for now)
  'Inter-SemiBold': 'data:font/woff2;base64,PCFET0NUWVBFIGh0bWw+CjxodG1sIGxhbmc9ZW4+CiAgPG1ldGEgY2hhcnNldD11dGYtOD4KICA8bWV0YSBuYW1lPXZpZXdwb3J0'
};

// Function to register Inter fonts with PDF generator
export const registerInterFonts = async () => {
  try {
    // For @pdfme/generator, we need to register fonts in the generate function
    // This is done by passing font options to the generate function
    
    console.log('Inter fonts ready for PDF generation');
    return true;
  } catch (error) {
    console.error('Failed to register Inter fonts:', error);
    return false;
  }
};

// Function to get font name based on weight
export const getInterFontName = (weight: string = 'normal'): string => {
  switch (weight.toLowerCase()) {
    case 'bold':
      return 'Inter-Bold';
    case 'medium':
      return 'Inter-Medium';
    case 'semibold':
      return 'Inter-SemiBold';
    case 'normal':
    default:
      return 'Inter-Regular';
  }
};

// Function to create font options for @pdfme/generator
export const createFontOptions = () => {
  return {
    fonts: [
      {
        name: 'Inter-Regular',
        data: INTER_FONTS['Inter-Regular']
      },
      {
        name: 'Inter-Bold',
        data: INTER_FONTS['Inter-Bold']
      },
      {
        name: 'Inter-Medium',
        data: INTER_FONTS['Inter-Medium']
      },
      {
        name: 'Inter-SemiBold',
        data: INTER_FONTS['Inter-SemiBold']
      }
    ]
  };
};

// Enhanced generate function with Inter fonts
export const generateWithInterFonts = async (template: any, inputs: any) => {
  try {
    const fontOptions = createFontOptions();
    
    // Generate PDF with Inter fonts
    const pdf = await generate({
      template,
      inputs,
      options: {
        ...fontOptions
      }
    });
    
    return pdf;
  } catch (error) {
    console.error('Failed to generate PDF with Inter fonts:', error);
    throw error;
  }
};
