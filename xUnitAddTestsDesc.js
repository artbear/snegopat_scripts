$engine JScript
$uname xUnitAddTestsDesc
$dname �������� �������� �������� ������ xUnitFor1C
$addin global
$addin stdlib
$addin stdcommands

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('log4js.js', SelfScript);
global.connectGlobals(SelfScript);

var logger = addLogger(SelfScript.uniqueName, Log4js.Level.DEBUG); //var logger = addLogger(SelfScript.uniqueName, Log4js.Level.ERROR);

var	TEST_CASE_DESC_FUNC_NAME = '��������������������'
var TEST_CASE_DESC_FUNC_TEMPLATE = 
"����� �����;\n\n\
������� ��������������������(����������������) �������\n\
\n\
	����� = ����������������;\n\
\n\
	�������� = ����� ������;\n\
\n\
	������� ��������;\n\
\n\
������������\n"

function addLogger(loggerName, logLevel) {
	var logger = Log4js.getLogger(loggerName);
	var appender = new Log4js.BrowserConsoleAppender();
	appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
	// ��������� ��� �����, ����� ��� ����������� ������� ��� ����������� ������������� ��� �� ���������
	appenders = [];
	appenders.push(appender);
	logger.onlog = new Log4js.CustomEvent();
	logger.onclear = new Log4js.CustomEvent();

	logger.setAppenders(appenders); // ����� ����� ���������� ��������� ����
	//logger.addAppender(new Log4js.FileAppender("f:\\somefile.log"));
	logger.setLevel(logLevel);
	return logger;
}

SelfScript.self['macros�������� ����������� �������� ������� xUnitFor1C'] = function() {
	var tw = GetTextWindow();
	if (!tw || tw.IsReadOnly()) {
		logger.debug('�� ����� ��������� ���� ��� ���� ��� ������')
		return true;
	}
		
	var parser = snegopat.parseSources(tw.text())
		logger.debug('parser.reStream ' + parser.reStream)
		
	var indexTestCaseDescFunc = parser.idxOfName(TEST_CASE_DESC_FUNC_NAME)
		logger.debug('parser.idxOfName("'+TEST_CASE_DESC_FUNC_NAME+'")=' + indexTestCaseDescFunc)
		
	var procNames = getTestCases(parser)
	if(!procNames){
		logger.debug('�� ����� ����������� �������� �������')
		return true
	}
	if (-1 == indexTestCaseDescFunc) {
		logger.debug('�� ����� ������� �������� ������ "'+TEST_CASE_DESC_FUNC_NAME+'"')
		logger.debug('�������� ������ ������� �������� ������ "'+TEST_CASE_DESC_FUNC_NAME+'"')
		
		tw.InsertLine(1, TEST_CASE_DESC_FUNC_TEMPLATE);
		
		parser = snegopat.parseSources(tw.text())
			logger.debug('parser.reStream ' + parser.reStream)
		
		indexTestCaseDescFunc = parser.idxOfName(TEST_CASE_DESC_FUNC_NAME)
			logger.debug('parser.idxOfName("'+TEST_CASE_DESC_FUNC_NAME+'")=' + indexTestCaseDescFunc)
	}		
	
	var data = getLineForInsertTestCaseDescriptions(parser, indexTestCaseDescFunc);
	
	var line = data.EndLine;
	if(line != -1){
		var arrayName = data.ArrayName
		deleteExistTestCaseDesc(tw, data.BeginLine, line, procNames, arrayName)
		
		parser = snegopat.parseSources(tw.text()) // �.�. �������� �����, ������ ������
			logger.debug('parser.reStream ' + parser.reStream)
		
		data = getLineForInsertTestCaseDescriptions(parser, indexTestCaseDescFunc);
		
		line = data.EndLine;
		if(line != -1){
			insertTestCaseDescIntoText(tw, line, procNames, arrayName);
		}
	}
	else
		logger.debug('�� ������� �������� ������� ��� ������� �������� �������� �������')
		
	return true;
}

function deleteExistTestCaseDesc(tw, beginLine, endLine, procNames, arrayName) {
	var range = tw.Range(beginLine, 1, endLine)
	var text = range.GetText()
		logger.debug('����� ������� '+TEST_CASE_DESC_FUNC_NAME + '\n'+text)
	
	for(i=0; i < procNames.length; i++) {
		var reTestCaseDesc = new RegExp( '^\\s*'+arrayName+'\\.��������\\(\\s*"'+procNames[i]+'"\\s*\\)\\s*;\\s*$', "igm");
			logger.debug('���������� ��������� ������� ������ '+reTestCaseDesc.source)
		text = text.replace(reTestCaseDesc,"");
	}
		logger.debug('����� ����� ������� '+TEST_CASE_DESC_FUNC_NAME + '\n'+text)
	range.SetText(text)
}

function insertTestCaseDescIntoText(tw, line, procNames, arrayName){
	logger.debug('arrayName <' + arrayName+'>')
	array = new Array(procNames.length);
	for(i=0; i < procNames.length; i++) {
		str = '\t'+arrayName+'.��������("'+procNames[i]+'");';
		array[i] = str;
			logger.debug('�������� ������ - ' + str)
	}
	array[procNames.length] = "";
	tw.InsertLine(line, StringUtils.fromLines(array));
}

function getLineForInsertTestCaseDescriptions(parser, indexTestCaseDescFunc){
	var resEndLine = -1;
	var resArrayName = ''
	var resBeginLine = -1
	var ret = { BeginLine: -1, EndLine: -1, ArrayName: '' };
	
	strForStream = addStringToTheLeft(indexTestCaseDescFunc, "0", 6-(""+indexTestCaseDescFunc).length)

		// ��� ������� ��������������������(�������������) ������� ... �������� = ����� ������; ... ������� ��������; ...
	var reTestCaseDescriptionsFuncBody = new RegExp('FuNm('+strForStream+')LpNm(\\d{6})RpEx.*?(Nm(\\d{6})EqNwNm(\\d{6})).*?ReNm(\\d{6})', "g");
	
	lexemsArray = reTestCaseDescriptionsFuncBody.exec(parser.reStream)
	var findRightBody = lexemsArray && lexemsArray.length >= 6
	if(findRightBody)
    {
   			logger.debug(TEST_CASE_DESC_FUNC_NAME + ' (�����) lexemsArray.index ' + lexemsArray.index + ' lexemsArray.lastIndex ' + lexemsArray.lastIndex )
		
		var testCaseArrayName = parser.name(lexemsArray[4]) //�������� �� ������ "�������� = ����� ������"
		var arrayKeywordName = parser.name(lexemsArray[5]) // ������ �� ���� �� ������
		var returnValueName = parser.name(lexemsArray[6]) // ������� ��������
			logger.debug('������������ ������� ���� �������� ������� "' + testCaseArrayName+'"')
			
		findRightBody = /������/i.test(arrayKeywordName) && testCaseArrayName.toLowerCase() == returnValueName.toLowerCase()
		if (findRightBody) {
			
	        var lex = parser.lexem(parser.posToLexem(lexemsArray.index))
		       	logger.debug('�������� ������ �� ������ ������� "'+TEST_CASE_DESC_FUNC_NAME+';" , ������ ' + lex.line)
			resBeginLine = lex.line
				
	        var lex = parser.lexem(parser.posToLexem(lexemsArray.lastIndex))
		       	logger.debug('�������� ������ �� ������ "������� '+testCaseArrayName+';" , ������ ' + lex.line)
				
			ret = { BeginLine: resBeginLine, EndLine: lex.line, ArrayName: testCaseArrayName }
		}
		else {
			logger.error('������ ���� ������ "������". � �������� "' + arrayKeywordName+'"')
			logger.error('������ ���� ������ "'+testCaseArrayName+'". � �������� "' + returnValueName+'"')
		}
    }
	else {
		logger.error('�� ����� ������� '+TEST_CASE_DESC_FUNC_NAME+' � ����������� ����������');
		if(lexemsArray)
			logger.error('���������� ��������� � ������� ������� ������ (lexemsArray.length) ������ ���� ������ ��� ����� 6, � �������� "' + lexemsArray.length+'"')
	}
	return ret;
}

function getTestCases(parser){
	var res = new Array();
    var reStream = parser.reStream
    var rePublicProcedureWithoutParams = /(Pc)Nm\d{6}LpRpEx/g
    var reTestCaseName = /^����/i

    while(rePublicProcedureWithoutParams.exec(reStream))
    {
        var lex = parser.lexem(parser.posToLexem(RegExp.index + 2))
       	logger.debug('�������� ��������� ' + lex.text + ", ������ " + lex.line)
        if (reTestCaseName.exec(lex.text)){
        	logger.debug('\t����� �������� ������ ' + lex.text + ", ������ " + lex.line)
        	res.push( lex.text )
        }
    }
 		logger.debug('procNames.length ' + res.length)
   return res.length ? res : null;
}

function addStringToTheLeft(src, str, count) {
	res = src;
	for(i=0; i < count; i++)
		res = str + res;
	return res;
}