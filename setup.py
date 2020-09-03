from setuptools import setup

setup(
    name='lit-web',
    version='0.0.0',
    description='LIT web server',
    packages=['litweb'],
    include_package_data=True,
    zip_safe=False,
    install_requires=['flask', 'lit-core', 'gunicorn']
)
