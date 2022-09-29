import os
import sys
#can decode UICB

def isBIN1File(file):
	filedata = file.read(20)
	if filedata[:4] == b'BIN1':
		return True
		print("valid BIN1 file has been loaded")
	else:
		return False
		print("please enter a valid BIN1 file")

def readHexFromBIN1File(file, offset, length):
	file.seek(offset)
	hexdata = file.read(length)
	hexstr = ''
	for h in hexdata:
		hexstr = hex(h)[2:].zfill(2) + hexstr
	return hexstr

def readStrFromBIN1File(file, offset, length):
	file.seek(offset)
	return file.read(length).decode()

def readStrFromOffset(file, strOffsetOffset):
	atOffset = strOffsetOffset
	strOffset = readHexFromBIN1File(file, atOffset, 0x4)
	strOffset = int(strOffset, 16) + 0x10
	strLength = readHexFromBIN1File(file, strOffset - 0x4, 0x4)
	strLength = int(strLength, 16)
	string = readStrFromBIN1File(file, strOffset, strLength)
	string = string[:-1]
	return string

def writeToJson(data):
	decodedBIN1File = sys.argv[1] + '.json'
	with open(decodedBIN1File, 'a') as jf:
		jf.write(data)

def connectJsonParts():
	decodedBIN1File = sys.argv[1] + '.json'
	with open(decodedBIN1File, 'r+') as f:
		text = f.read()
		fixedText = text.replace('}\n{', '},\n{')
		f.seek(0)
		f.write(fixedText)
		f.truncate()

def scanForAdress(file, fromOffset):
	if readHexFromBIN1File(file, fromOffset, 0x4) != "ffffffff" and readHexFromBIN1File(file, fromOffset + 0x8, 0x4) == readHexFromBIN1File(file, fromOffset + 0x10, 0x4):
		startOffset = readHexFromBIN1File(file, fromOffset, 0x4)
		startOffset = int(startOffset, 16) + 0xC
		fromOffset += 0x8
		endOffset = readHexFromBIN1File(file, fromOffset, 0x4)
		endOffset = int(endOffset, 16) + 0xC
	else:
		return "null"
	try:
		return startOffset, endOffset
	except:
		return "null"

def readData(file, type, fromOffset, toOffset):
	atOffset = fromOffset
	numFiles = readHexFromBIN1File(file, atOffset, 0x4)
	numFiles = int(numFiles, 16)
	atOffset += 0x4
	print("  Type " + str(type) + " found")
	#print("  from: " + str(hex(fromOffset)) + ", to: " + str(hex(toOffset)))
	print("  amount: " + str(numFiles))


	if type == 0:
		blockSize = 0x18

		for f in range(numFiles):

			value1 = readHexFromBIN1File(file, atOffset, 0x4)
			value1 = int(value1, 16)
			entityType = readHexFromBIN1File(file, atOffset + 0x4, 0x4)
			entityType = int(entityType, 16)
			string = readStrFromOffset(file, atOffset + 0x10)

			writeToJson("{\n")
			writeToJson('    "value1": "' + str(value1) + '",\n')
			writeToJson('    "value2": "' + str(entityType) + '",\n')
			writeToJson('    "string": "' + string + '"\n')

			if(f + 1) == numFiles:
				writeToJson("}\n")
			else:
				writeToJson("},\n")
			atOffset += blockSize

	if type == 1:
		blockSize = 0x0
		IDoffset = atOffset - 0x4
		IDLength = readHexFromBIN1File(file, IDoffset, 0x4)
		IDLength = int(IDLength, 16)
		FileID = readHexFromBIN1File(file, IDoffset, IDLength)
		FileID = int(FileID, 16)
		FileID = str(hex(FileID))
		FileID = FileID[:-4]
		writeToJson('{\n')
		writeToJson('    "unknownValue": "' + FileID + '"\n')
		writeToJson('}\n')

if len(sys.argv) == 2:
	filePathBIN1 = sys.argv[1]
	open(filePathBIN1 + '.json', 'w').close()
	with open(filePathBIN1,'rb') as file:
		try:
			if isBIN1File(file):
				print(filePathBIN1)
				writeToJson("[\n")
				#skips header so start at 0x10
				atOffset = 0x10
				for i in range(8):
					adress = scanForAdress(file, atOffset)
					atOffset += 0x18
					if(adress != "null"):
						readData(file, i, adress[0], adress[1])
				writeToJson("]\n")
				connectJsonParts()
		except Exception as e:
			print(e)
else:
	print('Usage: python(3) UICBdecode.py <path to UICB file>')
