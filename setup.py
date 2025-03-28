from setuptools import setup, find_packages

setup(
    name="infinite-inkblots",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "numpy",
        "Pillow",
    ],
    description="Generate unique Rorschach-style inkblots from Ethereum addresses",
    author="Jon Bray",
    author_email="heyjonbray@pm.me",
    url="https://github.com/heyjonbray/infinite-inkblots",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.6",
    entry_points={
        'console_scripts': [
            'generate-inkblot=rorschach.example:main',
        ],
    },
)