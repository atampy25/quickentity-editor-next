@echo off

echo This will extract up to 8 GB of files from HITMAN 3.
echo Ensure you have Node.js (at least version 16) installed.
echo Ensure you have rpkg-cli and ResourceTool in this folder.
echo Ensure you rename the hash list to hash_list2.txt in this folder.
echo Ensure you have edited extractAllOfFiletypes.js to use your Runtime path.

pause

call npm install
node extractAllOfFiletypes
node convertAllASETMetas
node convertAllCPPTs
node convertAllCPPTMetas
node convertAllTBLUs
node convertAllTBLUMetas
node convertAllTEMPs
node convertAllTEMPMetas
node convertAllUICBs
node convertAllUICTMetas
node convertAllQNs
node findUICBPropTypes
node getCPPTInfo
node getCPPTOutputPins

echo Done! Enable game file extensions and input this folder's path in QuickEntity Editor to unlock the extra features.
pause