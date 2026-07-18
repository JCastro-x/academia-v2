import { DocuText } from 'docutext'

export async function extractTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const doc = DocuText.fromBuffer(uint8Array)
    const text = doc.text
    
    return text
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    throw error
  }
}

export async function extractTextFromPDFWithPages(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const doc = await DocuText.fromBuffer(uint8Array)
    const pages = doc.getPages()
    
    return pages.map((page, index) => ({
      pageNumber: index + 1,
      text: page.getText(),
    }))
  } catch (error) {
    console.error('Error extracting text from PDF with pages:', error)
    throw new Error('No se pudo extraer el texto del PDF')
  }
}
