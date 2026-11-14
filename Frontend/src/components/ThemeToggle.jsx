import React from 'react';
import { useData } from '../context/DataContext';
import '../styles/ThemeToggle.css';

export default function ThemeToggle() {
    const { isDarkMode, toggleTheme } = useData();

    return (
        <div className="theme-toggle-fixed" title="Toggle Dark Mode">
            <input 
                className="theme-switch-input" 
                id="theme-switch" 
                type="checkbox" 
                checked={isDarkMode}
                onChange={toggleTheme}
            />
            <label className="theme-switch-label" htmlFor="theme-switch" />
        </div>
    );
}