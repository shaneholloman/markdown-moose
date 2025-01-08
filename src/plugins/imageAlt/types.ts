// src/plugins/imageAlt/types.ts
export interface ImageMatch {
    fullMatch: string;    // The full image markdown syntax
    altText: string;      // Current alt text (may be empty)
    url: string;         // The image URL
    position: number;    // Position in document
}

export interface HeadingMatch {
    text: string;        // Heading text content
    level: number;       // Heading level (1-6)
    position: number;    // Position in document
}
