from PIL import Image

# Open the source image
with Image.open('tnt_logo.png') as img:
    # Create icons in different sizes
    sizes = {
        'icons/icon16.png': (16, 16),
        'icons/icon48.png': (48, 48),
        'icons/icon128.png': (128, 128)
    }
    
    for output_path, size in sizes.items():
        # Resize image with high-quality resampling
        resized = img.resize(size, Image.Resampling.LANCZOS)
        # Save the resized image
        resized.save(output_path, 'PNG') 