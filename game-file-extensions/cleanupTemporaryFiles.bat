@echo off

cd TEMP
del *.TEMP
del *.TEMP.json
del *.meta
del *.meta.JSON

cd ..\TBLU
del /Q *.*

cd ..\UICB
del *.UICB
del *.meta

cd ..\UICT
del *.meta

cd ..\MATE
del *.MATE
del *.meta

cd ..\MATT
del *.meta

cd ..\WSWB
del *.WSWB
del *.WSWB.meta

cd ..\DWSB
del *.DSWB
del *.DSWB.meta

cd ..