import setuptools

# Read README for long description
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="streamlit-auth0-component-extended",
    version="0.3.1",
    author="Aditya Karnam",
    author_email="akarnam37@gmail.com",
    description="Enhanced Streamlit Auth0 login component with persistent authentication, custom audience, scope, and authorization parameters",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/adityak74/streamlit-auth0-component",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.6",
    install_requires=[
        "streamlit >= 0.63",
        "python-jose == 3.3.0"
    ],
    keywords="streamlit auth0 authentication login oauth oidc",
    project_urls={
        "Bug Reports": "https://github.com/adityak74/streamlit-auth0-component/issues",
        "Source": "https://github.com/adityak74/streamlit-auth0-component",
        "Documentation": "https://github.com/adityak74/streamlit-auth0-component#readme",
    },
)
