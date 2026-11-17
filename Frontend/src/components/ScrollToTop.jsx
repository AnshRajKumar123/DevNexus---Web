import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // 1. Scroll the main window (catches mobile views)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // 2. Scroll the internal dashboard containers (catches desktop views)
        const scrollableElements = [
            document.querySelector('.main-content'),
            document.querySelector('.main-content-wrapper'),
            document.querySelector('.dashboard-container')
        ];

        scrollableElements.forEach(el => {
            if (el) {
                el.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                // Fallback for older browsers that don't support 'instant'
                el.scrollTop = 0; 
            }
        });
    }, [pathname]);

    return null;
}