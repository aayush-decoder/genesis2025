import { useEffect } from 'react';

const SEO = ({ 
  title = "Genesis 2025: Real-Time HFT Market Surveillance & Analytics Platform (Prototype)",
  description = "Prototype of high-frequency trading surveillance platform with real-time market microstructure analytics, order flow imbalance detection, and anomaly monitoring for cryptocurrency markets.",
  keywords = "HFT, high frequency trading, market surveillance, order flow, market microstructure, cryptocurrency trading, real-time analytics",
  image = "/og-image.png",
  url = window.location.href
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta tags
    const updateMetaTag = (name, content, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector);
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic SEO
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', `${window.location.origin}${image}`, true);
    updateMetaTag('og:url', url, true);
    
    // Twitter
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', `${window.location.origin}${image}`);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
    
  }, [title, description, keywords, image, url]);

  return null; // This component doesn't render anything
};

export default SEO;