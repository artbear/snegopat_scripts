$engine JScript
$uname test_xUnitAddTestsDesc
$dname ����� ������ xUnitAddTestsDesc.js
$addin global
$addin stdcommands
$addin stdlib

//global.connectGlobals(SelfScript);

// ��������� ��� ������ ���� ������� JScript - ������ ����� � Notepad++ 
//      ^function\s*([^\(]+)\(
//      (^function\s*[^\(\s]+\s*\()|(^[^\.\s]+\.prototype\.[^\.\s]+\s+)

stdlib.require('jsUnitCore.js', SelfScript);

var mainFolder = profileRoot.getValue("Snegopat/MainFolder");
var testDir = mainFolder + 'scripts\\Tests\\Automated\\xUnitFor1C\\AddTestsDesc\\';
var pluginAppender = stdlib.require(mainFolder + 'scripts\\xUnitAddTestsDesc.js'); //, SelfScript); // ����� �������� ������� �� ��������� �������

var TWW = stdlib.require('TextWindow.js');

var textDoc = null;
var twnd = null;
    
var appender = null;

function setUp()
{
    textDoc = v8New("TextDocument");
	var text = "��� = ����� ���������������;\n���";
    textDoc.SetText(text);

    textDoc.Show();
    
    twnd = TWW.GetTextWindow();

    appender = new pluginAppender._AppenderTestCaseDescriptionsIntoText(twnd);
}

function tearDown()
{
    destroyTextWindow();
}

function destroyTextWindow()
{
    if (twnd)
        delete twnd;
    
    // ����� ��� �������� �� ���������� ��������� "��������?", �������� �������� �� ��������� ����.
    var tempFile = globalContext("{4A993AB7-2F75-43CF-B34A-0AD9FFAEE7E3}").GetTempFileName();
    textDoc.Write(tempFile);
    
    // ������� ���� ���������� ���������.
    stdcommands.Frame.FileClose.send();    
    
    // ������ ��������� ����.
    var f = v8New("File", tempFile);
    globalContext("{22A21030-E1D6-46A0-9465-F0A5427BE011}").DeleteFiles(f.Path, f.Name);
}

SelfScript.self['macrosTest � ������ ��� ���� �������� �������� �������'] = function() {

    var textDoc = v8New("TextDocument");
	textDoc.Read(testDir+'xUnitAddTestsDesc_���������������������.txt')
	
	var predLineCount = textDoc.LineCount();
	var text = textDoc.GetText();
	twnd.SetText(text)
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var procName = '������������_������������'
		var reTestCaseDesc = new RegExp( '^\\s*��������\\.��������\\(\\s*"'+procName+'"\\s*\\)\\s*;\\s*$', "igm");
		assertFalse('�� ����� �������� ����� '+procName, reTestCaseDesc.test(text));
	
	success = appender.addTestCaseDescriptionsIntoText();
		assertTrue('�� ������� ��������� ����!', success);
		assertEquals(twnd.LinesCount(), predLineCount+2);
		
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var text = twnd.GetText();
	
	for(i=0; i < procNames.length; i++) {
		var reTestCaseDesc = new RegExp( '^\\s*��������\\.��������\\(\\s*"'+procNames[i]+'"\\s*\\)\\s*;\\s*$', "igm");
			//logger.debug('���������� ��������� ������� ������ '+reTestCaseDesc.source)
		assertTrue('�� ����� �������� ����� '+procNames[i], reTestCaseDesc.test(text));
	}

		//var txt = "����� ������;\n������ = 2;";
		//var arrStrings = txt.split("\n");
		//assertTrue('�� ������� ��������� ����!', obInts.removeComments(arrStrings));
}

SelfScript.self['macrosTest � ������ ������ ��� ������� ��������������������, �� ���� �������� ������ ����������'] = function() {
	//pluginAppender.logger.setLevel(pluginAppender.Log4js.Level.DEBUG);
	
    var textDoc = v8New("TextDocument");
	textDoc.Read(testDir+'xUnitAddTestsDesc_�����������������������.txt')
	
	predLineCount = textDoc.LineCount()
	var text = textDoc.GetText();
	twnd.SetText(text)
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var procName = '������������_������������'
		var reTestCaseDesc = new RegExp( '^\\s*��������\\.��������\\(\\s*"'+procName+'"\\s*\\)\\s*;\\s*$', "igm");
		assertFalse('�� ����� �������� ����� '+procName, reTestCaseDesc.test(text));
	
	success = appender.addTestCaseDescriptionsIntoText();
		assertTrue('�� ������� ��������� ����!', success);
		assertEquals(twnd.LinesCount(), predLineCount + 15);
		
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames.length, 2);
		
	var text = twnd.GetText();
	
	for(i=0; i < procNames.length; i++) {
		var reTestCaseDesc = new RegExp( '^\\s*��������\\.��������\\(\\s*"'+procNames[i]+'"\\s*\\)\\s*;\\s*$', "igm");
			//logger.debug('���������� ��������� ������� ������ '+reTestCaseDesc.source)
		assertTrue('�� ����� �������� ����� '+procNames[i], reTestCaseDesc.test(text));
	}
}

SelfScript.self['macrosTest � ������ ������ ��� �������� �������'] = function() {
	
    var textDoc = v8New("TextDocument");
	textDoc.Read(testDir+'xUnitAddTestsDesc_��������������������.txt')
	
	predLineCount = textDoc.LineCount()
	predText = textDoc.GetText()
	twnd.SetText(predText)
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames, null);
	
	success = appender.addTestCaseDescriptionsIntoText();
		assertFalse('�� ������� ��������� ����!', success);
		assertEquals(predText, textDoc.GetText());
		//assertEquals(TrimAll(predText), TrimAll(textDoc.GetText()));
		assertEquals(twnd.LinesCount(), predLineCount);
	
	appender.parseSources();
	var procNames = appender.getTestCases();
		assertEquals(procNames, null);
		
}

function TrimAll(src) {
    return src.replace(/(^\s*)|(\s*$)/g, ""); //trim
}
