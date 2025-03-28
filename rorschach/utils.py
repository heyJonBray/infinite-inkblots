import hashlib
import random
import numpy as np

def set_seed_from_eth_address(eth_address):
    """
    Converts an Ethereum address to a deterministic seed for random number generation.
    
    Parameters:
        eth_address (str): Ethereum address to use as seed
        
    Returns:
        tuple: (seed, np_seed) - seeds for Python's random and NumPy's random
    """
    if eth_address is None:
        return None, None
        
    # Normalize the address (remove '0x' if present, convert to lowercase)
    eth_address = eth_address.lower().replace('0x', '')
    
    # Create a hash of the address to get a deterministic number
    hash_object = hashlib.sha256(eth_address.encode())
    hex_digest = hash_object.hexdigest()
    
    # Convert the first 8 bytes of the hash to an integer
    seed = int(hex_digest[:16], 16)
    np_seed = seed % (2**32)
    
    return seed, np_seed

def apply_seed(seed, np_seed):
    """
    Sets the random seed for both Python's random and NumPy's random modules.
    
    Parameters:
        seed (int): Seed for Python's random module
        np_seed (int): Seed for NumPy's random module
    """
    if seed is not None:
        random.seed(seed)
    
    if np_seed is not None:
        np.random.seed(np_seed)