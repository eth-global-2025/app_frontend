const ASI_ONE_API_KEY = import.meta.env.VITE_ASI_ONE_API_KEY;

export interface AsiOneResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const generateFileDescription = async (file: File): Promise<string> => {
  if (!ASI_ONE_API_KEY) {
    throw new Error('ASI_ONE_API_KEY is not configured');
  }

  const url = 'https://api.asi1.ai/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ASI_ONE_API_KEY}`,
  };

  // Read file content based on file type
  let fileContent = '';
  const fileName = file.name;
  const fileType = file.type;

  try {
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      fileContent = await file.text();
    } else if (fileType === 'application/pdf') {
      // For PDF files, we'll use a simple approach - extract text if possible
      // Note: This is a simplified approach. For production, you might want to use a PDF parsing library
      fileContent = `PDF file: ${fileName}`;
    } else if (fileType.startsWith('image/')) {
      // For images, we'll describe the file type
      fileContent = `Image file: ${fileName}`;
    } else if (fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      fileContent = `Document file: ${fileName}`;
    } else {
      fileContent = `File: ${fileName}`;
    }
  } catch (error) {
    console.error('Error reading file content:', error);
    fileContent = `File: ${fileName}`;
  }

  const prompt = `Analyze the following file and generate a concise, accurate description of its content. The description should be between 200-300 characters and should focus on the main topic, purpose, or content of the file. Be factual and avoid speculation.

File name: ${fileName}
File type: ${fileType}
File content preview: ${fileContent.substring(0, 1000)}${fileContent.length > 1000 ? '...' : ''}

Generate a professional, academic-style description that accurately represents the file's content:`;

  const data = {
    model: 'asi1-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.3,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status} ${res.statusText}`);
    }

    const response: AsiOneResponse = await res.json();
    const description = response.choices[0].message.content.trim();

    // Ensure description is within character limits
    if (description.length > 300) {
      return description.substring(0, 297) + '...';
    }

    return description || `Research document: ${fileName}`;
  } catch (error) {
    console.error('Error generating description:', error);
    // Fallback description
    return `Research document: ${fileName}`;
  }
};