export async function importDataFrameFromPDF(file: File): Promise<any | null> {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const text = new TextDecoder('utf-8').decode(uint8);
    const keywordsMatch = text.match(/\/Keywords \((DFDATA:[^)]+)\)/);
    if (keywordsMatch && keywordsMatch[1]) {
        const encoded = keywordsMatch[1].replace('DFDATA:', '');
        try {
            const jsonStr = decodeURIComponent(escape(atob(encoded)));
            const dfState = JSON.parse(jsonStr);
            return dfState;
        } catch (e) {
            return null;
        }
    }
    return null;
}
