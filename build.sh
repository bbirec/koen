#!/bin/bash

electron-packager . KOEN --platform=darwin --arch=x64 --version=0.36.2  --overwrite=true --icon=icon/icon --asar=true --out=out
electron-packager . KOEN --platform=win32 --arch=ia32 --version=0.36.2  --overwrite=true --icon=icon/icon --asar=true --out=out
