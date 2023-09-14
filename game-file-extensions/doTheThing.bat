@echo off

echo This will extract up to 8 GB of files from HITMAN 3.
echo Ensure you have Node.js (at least version 16) installed.
echo Ensure you have rpkg-cli and ResourceTool in this folder.
echo Ensure you rename the hash list to hash_list2.txt in this folder.
echo Ensure you have edited extractAllOfFiletypes.js to use your Runtime path.

pause

call npm install
ren hash_list2.txt hash_list.txt
powershell "node extractAllOfFiletypes | tee log-extraction.txt"
ren hash_list.txt hash_list2.txt
powershell "node convertAllMATTMetas | tee log-matt-meta-conversion.txt"
powershell "node convertAllASETMetas | tee log-aset-meta-conversion.txt"
powershell "node convertAllCPPTs | tee log-cppt-conversion.txt"
powershell "node convertAllCPPTMetas | tee log-cppt-meta-conversion.txt"
powershell "node convertAllTBLUs | tee log-tblu-conversion.txt"
powershell "node convertAllTBLUMetas | tee log-tblu-meta-conversion.txt"
powershell "node convertAllTEMPs | tee log-temp-conversion.txt"
powershell "node convertAllTEMPMetas | tee log-temp-meta-conversion.txt"
powershell "node convertAllUICBs | tee log-uicb-conversion.txt"
powershell "node convertAllUICTMetas | tee log-uict-meta-conversion.txt"
powershell "node convertAllQNs | tee log-qn-conversion.txt"
powershell "node convertAllSwitches | tee log-switch-conversion.txt"
powershell "node findUICBPropTypes | tee log-uicb-proptype-finding.txt"
powershell "node getCPPTInfo | tee log-cppt-property-calculation.txt"
powershell "node getCPPTPins | tee log-cppt-pin-crawling.txt"
powershell "node getAllMATEProps | tee log-mate-prop-conversion.txt"

echo Done! Enable game file extensions and input this folder's path in QuickEntity Editor to unlock the extra features. You can also run cleanupTemporaryFiles.bat in this folder to reclaim some disk space.
pause