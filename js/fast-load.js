// Fast loading optimization - defer heavy content
document.addEventListener('DOMContentLoaded', function() {
    // Load images after page is fully rendered and scrollable
    setTimeout(function() {
        // Replace placeholder divs with actual images when user scrolls or after delay
        const placeholders = document.querySelectorAll('div[style*="Loading..."], div[style*="Content Loading..."], div[style*="Visual Content"], div[style*="Image Preview"], div[style*="Content Preview"], div[style*="Book Cover"]');
        
        const loadPlaceholder = function(placeholder) {
            const text = placeholder.textContent.trim();
            if (text === 'Loading...') {
                placeholder.innerHTML = '<img width="400" height="300" alt="" src="images/Screenshot-2025-05-15-081815.png" loading="lazy" class="image cover-image">';
            } else if (text === 'Content Loading...') {
                placeholder.innerHTML = '<img class="image cover-image" src="images/20250515_0856_Futuristic-Library-Exchange_simple_compose_01jva06nw7enrs9p624jc01gse-p-500.png" width="1024" height="768" alt="" loading="lazy">';
            } else if (text === 'Visual Content') {
                placeholder.innerHTML = '<img class="cover-image-12" src="images/20250515_0825_Cosmic-Storybook-Dreamscape_simple_compose_01jv9yeaeeecpsar4hvg2nbc7p-p-500.png" width="1024" height="1536" alt="" loading="lazy">';
            } else if (text === 'Image Preview') {
                placeholder.innerHTML = '<img width="400" height="600" alt="" src="https://cdn.prod.website-files.com/67f1de1580e9ecbd4694885b/67f7d942ce95d137cc8c4951_Screenshot%202025-04-10%20104339.png" loading="lazy" class="utility-image-contain">';
            } else if (text === 'Content Preview') {
                placeholder.innerHTML = '<img width="400" height="600" alt="" src="images/Screenshot-2025-04-10-104201.png" loading="lazy" class="utility-image-contain">';
            } else if (text === 'Book Cover') {
                placeholder.innerHTML = '<img width="400" height="600" alt="" src="images/Shingeki_no_Kyojin_manga_volume_1.jpg" loading="lazy" class="utility-image-contain">';
            }
        };
        
        // Load images immediately for better user experience
        placeholders.forEach(loadPlaceholder);
        
    }, 500); // Load after 500ms delay for better performance
});