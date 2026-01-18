import React, { useState, useEffect } from 'react';
import { offlineService } from '../services/offlineService';

interface QuestionImageProps {
    src: string;
    alt: string;
    className?: string;
}

const QuestionImage: React.FC<QuestionImageProps> = ({ src, alt, className }) => {
    const [imgSrc, setImgSrc] = useState<string>(src);

    useEffect(() => {
        let active = true;

        const loadOfflineImage = async () => {
            // Check if it's a web URL
            if (src.startsWith('http')) {
                try {
                    const blobUrl = await offlineService.getImageUrl(src);
                    if (blobUrl && active) {
                        setImgSrc(blobUrl);
                    }
                } catch (e) {
                    console.error("Failed to load offline image", e);
                }
            }
        };

        loadOfflineImage();

        return () => {
            active = false;
            // Revoke blob URL if we created one (not straightforward here as we don't track if it was blob or original)
            // Browsers handle this somewhat, but explicit cleanup is better if we store the blobUrl in a specific ref.
        };
    }, [src]);

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            onError={(e) => {
                // Fallback to original src if blob fails, or placeholder
                if (imgSrc !== src) {
                    setImgSrc(src);
                }
            }}
        />
    );
};

export default QuestionImage;
