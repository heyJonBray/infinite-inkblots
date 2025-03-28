from setuptools import setup, find_packages

setup(
    name="rorschach-generator",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "numpy",
        "Pillow",
    ],
    description="A realistic Rorschach inkblot image generator",
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
            'generate-rorschach=rorschach.example:main',
        ],
    },
)