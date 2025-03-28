import hashlib
import re

def extract_eth_features(eth_address):
    """
    Extract features from an Ethereum address that can be used to influence
    the visual characteristics of the Rorschach inkblot.
    
    Parameters:
        eth_address (str): An Ethereum address (with or without '0x' prefix)
        
    Returns:
        dict: Features extracted from the Ethereum address
    """
    # Normalize address (remove '0x' prefix if present, convert to lowercase)
    address = eth_address.lower().replace('0x', '')
    
    # Validate address format
    if not re.match(r'^[0-9a-f]{40}$', address):
        raise ValueError("Invalid Ethereum address format")
    
    # Create hash for deterministic seed
    hash_object = hashlib.sha256(address.encode())
    hex_digest = hash_object.hexdigest()
    seed = int(hex_digest[:8], 16)  # Using only 8 hex chars to stay under 2^32
    
    # Extract features from the address
    features = {
        # Basic seed for overall pattern
        'seed': seed,
        
        # Count zeros (affects density)
        'zero_count': address.count('0'),
        
        # Count ones (affects contrast)
        'one_count': address.count('1'),
        
        # Count letters vs numbers (affects complexity)
        'letter_count': sum(1 for c in address if c.isalpha()),
        'number_count': sum(1 for c in address if c.isdigit()),
        
        # End characters (affects edge features)
        'end_chars': address[-4:],
        'start_chars': address[:4],
        
        # Repeated character sequences (affects symmetry variations)
        'max_repeat': max(len(list(g)) for _, g in itertools.groupby(address)),
        
        # Character distribution metrics
        'char_diversity': len(set(address)) / len(address),  # Normalized unique character count
        
        # Distribution of even vs odd characters (affects balance)
        'even_char_ratio': sum(1 for c in address if int(c, 16) % 2 == 0) / len(address),
        
        # Distribution of high vs low characters (affects distribution)
        'high_char_ratio': sum(1 for c in address if int(c, 16) >= 8) / len(address),
    }
    
    return features

def apply_eth_features_to_noise(noise_params, eth_features):
    """
    Apply Ethereum address features to noise generation parameters
    
    Parameters:
        noise_params (dict): Basic noise parameters
        eth_features (dict): Features extracted from Ethereum address
        
    Returns:
        dict: Modified noise parameters based on Ethereum features
    """
    modified_params = noise_params.copy()
    
    # Modify noise_scale based on character diversity (more diverse = more detailed)
    # Map to a range between 0.005 (detailed) and 0.015 (broad)
    diversity_factor = eth_features['char_diversity']  # 0.025 to 0.625 typically
    modified_params['noise_scale'] = 0.015 - (diversity_factor * 0.016)
    
    # Modify octaves based on zero count (more zeros = more octaves = more detail layers)
    # Map to a range between 4 and 8
    zero_factor = min(1.0, eth_features['zero_count'] / 20)  # Normalize to 0-1
    modified_params['octaves'] = 4 + int(zero_factor * 4)
    
    # Modify persistence based on one count (affects how much detail from higher octaves)
    # Map to a range between 0.4 and 0.7
    one_factor = min(1.0, eth_features['one_count'] / 20)  # Normalize to 0-1
    modified_params['persistence'] = 0.4 + (one_factor * 0.3)
    
    # Modify lacunarity based on letter vs number ratio (affects scaling between octaves)
    # Map to a range between 1.8 and 2.2
    letter_ratio = eth_features['letter_count'] / 40  # Normalize to 0-1
    modified_params['lacunarity'] = 1.8 + (letter_ratio * 0.4)
    
    # Modify contrast based on high/low character ratio
    # Map to a range between 0.9 and 1.3
    high_low_factor = eth_features['high_char_ratio']  # Already 0-1
    modified_params['contrast'] = 0.9 + (high_low_factor * 0.4)
    
    # Modify threshold based on even/odd character ratio
    # Map to a range between 0.45 and 0.55
    even_odd_factor = eth_features['even_char_ratio']  # Already 0-1
    modified_params['threshold'] = 0.45 + (even_odd_factor * 0.1)
    
    return modified_params

def get_eth_color_scheme(eth_features):
    """
    Determine color scheme based on Ethereum address features.
    For grayscale, this affects the black and white levels.
    
    Parameters:
        eth_features (dict): Features extracted from Ethereum address
        
    Returns:
        dict: Color scheme parameters
    """
    # Calculate color scheme parameters based on address features
    
    # Black level: how dark the ink gets (0-30)
    # Affected by the number of low hex values (0-7)
    high_char_ratio = eth_features['high_char_ratio']
    black_level = int(30 - (high_char_ratio * 20))  # Lower ratio = darker black
    
    # White level: background color (240-255)
    # Affected by the number of zeros
    zero_factor = min(1.0, eth_features['zero_count'] / 20)
    white_level = 240 + int(zero_factor * 15)  # More zeros = whiter background
    
    # Contrast level: affects the transition between black and white
    # Affected by character diversity
    diversity_factor = eth_features['char_diversity']
    contrast_level = 0.8 + (diversity_factor * 0.6)  # More diversity = more contrast
    
    # Threshold: value that determines ink vs. background (0.4-0.6)
    # Affected by even/odd ratio
    even_odd_factor = eth_features['even_char_ratio']
    threshold = 0.45 + (even_odd_factor * 0.1)  # Higher ratio = more ink coverage
    
    return {
        'black_level': black_level,
        'white_level': white_level,
        'contrast_level': contrast_level,
        'threshold': threshold
    }

# Add missing import
import itertools