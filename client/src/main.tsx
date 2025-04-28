import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add Remix Icons from CDN
const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.href = 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css';
document.head.appendChild(linkElement);

// Add font styles
const fontElement = document.createElement('link');
fontElement.rel = 'stylesheet';
fontElement.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
document.head.appendChild(fontElement);

// Add title
const titleElement = document.createElement('title');
titleElement.textContent = 'TimeTrack - Employee Time Tracking';
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
