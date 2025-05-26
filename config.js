// Configuration utilities for TNT extension

// Utility functions for space configuration
function validateSpaceConfig(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('Configuration must be a valid object');
    }
    
    if (!config.name || typeof config.name !== 'string') {
        throw new Error('Space must have a valid name');
    }
    
    if (config.filters && !Array.isArray(config.filters)) {
        throw new Error('Filters must be an array');
    }
    
    if (config.links && !Array.isArray(config.links)) {
        throw new Error('Links must be an array');
    }
    
    if (config.links) {
        config.links.forEach((link, index) => {
            if (!link.label || !link.url || !link.tag) {
                throw new Error(`Link at index ${index} must have label, url, and tag`);
            }
        });
    }
    
    return true;
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.TNTConfig = {
        validateSpaceConfig
    };
} 