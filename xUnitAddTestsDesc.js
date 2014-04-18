$engine JScript
$uname xUnitAddTestsDesc
$dname Добавить описания тестовых случае xUnitFor1C
$addin global
$addin stdlib
$addin stdcommands

stdlib.require('TextWindow.js', SelfScript);
stdlib.require('log4js.js', SelfScript);
global.connectGlobals(SelfScript);

var logger = addLogger(SelfScript.uniqueName, Log4js.Level.ERROR); //Log4js.Level.DEBUG

stdcommands.Frame.FileSave.addHandler(SelfScript.self, "onFileSave_AddTestCaseDescriptionsIntoText")

SelfScript.self['macrosВставить определения тестовых случаев xUnitFor1C'] = function() {
	addTestCaseDescriptionsIntoText()
	return true;
}

function addTestCaseDescriptionsIntoText() {
	var textWindow = GetTextWindow();
	if (!textWindow || textWindow.IsReadOnly()) {
		logger.debug('Не нашли текстовое окно или окно для чтения')
		return false;
	}
	
	var appender = new _AppenderTestCaseDescriptionsIntoText(textWindow)
	return appender.addTestCaseDescriptionsIntoText();
}

function onFileSave_AddTestCaseDescriptionsIntoText(cmd)
{
	if(cmd.isBefore)
	{
		var mdObj, av = windows.getActiveView()
		if(!av || !(mdObj = av.mdObj))
			return
		// Посмотрим, не внешний ли отчет/обработка сохраняется.
		if(mdObj.container != mdObj.container.masterContainer) {
		    try{
				addTestCaseDescriptionsIntoText();
		    }catch(e){}
		}
	}
}

function addLogger(loggerName, logLevel) {
	var logger = Log4js.getLogger(loggerName);
	var appender = new Log4js.BrowserConsoleAppender();
	appender.setLayout(new Log4js.PatternLayout(Log4js.PatternLayout.TTCC_CONVERSION_PATTERN));
	// следующий код нужен, чтобы при перезапуске скрипта без перезапуска Конфигуратора лог не задвоится
	appenders = [];
	appenders.push(appender);
	logger.onlog = new Log4js.CustomEvent();
	logger.onclear = new Log4js.CustomEvent();

	logger.setAppenders(appenders); // конец блока исключения задвоения лога
	//logger.addAppender(new Log4js.FileAppender("f:\\somefile.log"));
	logger.setLevel(logLevel);
	return logger;
}


var	TEST_CASE_DESC_FUNC_NAME = 'ПолучитьСписокТестов'
var TEST_CASE_DESC_FUNC_TEMPLATE = 
"Перем юТест;\n\n\
Функция ПолучитьСписокТестов(ЮнитТестирование) Экспорт\n\
\n\
	юТест = ЮнитТестирование;\n\
\n\
	ВсеТесты = Новый Массив;\n\
\n\
	Возврат ВсеТесты;\n\
\n\
КонецФункции\n"

_AppenderTestCaseDescriptionsIntoText = stdlib.Class.extend({
    construct : function (textWindow) {
        this.textWindow = textWindow;
		this.parseSources();
    },
	
	parseSources : function () {
		this.parser = snegopat.parseSources(this.textWindow.text());
    },

	addTestCaseDescriptionsIntoText : function() {
			
		var parser = this.parser //snegopat.parseSources(this.textWindow.text())
			logger.debug('parser.reStream ' + parser.reStream)
			
		var indexTestCaseDescFunc = parser.idxOfName(TEST_CASE_DESC_FUNC_NAME)
			logger.debug('parser.idxOfName("'+TEST_CASE_DESC_FUNC_NAME+'")=' + indexTestCaseDescFunc)
			
		var procNames = this.getTestCases(parser)
		if(!procNames){
			logger.debug('Не нашли определения тестовых случаев')
			return false
		}
		if (-1 == indexTestCaseDescFunc) {
			logger.debug('Не нашли функцию описания тестов "'+TEST_CASE_DESC_FUNC_NAME+'"')
			logger.debug('Вставляю шаблон функции описания тестов "'+TEST_CASE_DESC_FUNC_NAME+'"')
			
			this.textWindow.InsertLine(1, TEST_CASE_DESC_FUNC_TEMPLATE);
			
			parser = snegopat.parseSources(this.textWindow.text())
				logger.debug('parser.reStream ' + parser.reStream)
			
			indexTestCaseDescFunc = parser.idxOfName(TEST_CASE_DESC_FUNC_NAME)
				logger.debug('parser.idxOfName("'+TEST_CASE_DESC_FUNC_NAME+'")=' + indexTestCaseDescFunc)
		}		
		
		var data = this.getLineForInsertTestCaseDescriptions(parser, indexTestCaseDescFunc);
		
		var line = data.EndLine;
		if(line != -1){
			var arrayName = data.ArrayName
			this.deleteExistTestCaseDesc(this.textWindow, data.BeginLine, line, procNames, arrayName)
			
			parser = snegopat.parseSources(this.textWindow.text()) // т.к. изменили текст, заново парсим
				logger.debug('parser.reStream ' + parser.reStream)
			
			data = this.getLineForInsertTestCaseDescriptions(parser, indexTestCaseDescFunc);
			
			line = data.EndLine;
			if(line != -1){
				this.insertTestCaseDescIntoText(this.textWindow, line, procNames, arrayName);
			}
			
			return true;
		}

		logger.debug('Не удалось получить позицию для вставки описания тестовых случаев')
		return false;
	},

	deleteExistTestCaseDesc : function (textWindow, beginLine, endLine, procNames, arrayName) {
		var range = this.textWindow.Range(beginLine, 1, endLine)
		var text = range.GetText()
			logger.debug('Текст функции '+TEST_CASE_DESC_FUNC_NAME + '\n'+text)
		
		for(i=0; i < procNames.length; i++) {
			var reTestCaseDesc = new RegExp( '^\\s*'+arrayName+'\\.Добавить\\(\\s*"'+procNames[i]+'"\\s*\\)\\s*;\\s*$', "igm");
				logger.debug('Регулярное выражение шаблона замены '+reTestCaseDesc.source)
			text = text.replace(reTestCaseDesc,"");
		}
			logger.debug('Новый текст функции '+TEST_CASE_DESC_FUNC_NAME + '\n'+text)
		range.SetText(text)
	},

	insertTestCaseDescIntoText : function (textWindow, line, procNames, arrayName){
		logger.debug('arrayName <' + arrayName+'>')
		array = new Array(procNames.length);
		for(i=0; i < procNames.length; i++) {
			str = '\t'+arrayName+'.Добавить("'+procNames[i]+'");';
			array[i] = str;
				logger.debug('Вставляю строку - ' + str)
		}
		array[procNames.length] = "";
		this.textWindow.InsertLine(line, StringUtils.fromLines(array));
	},

	getLineForInsertTestCaseDescriptions : function (parser, indexTestCaseDescFunc){
		var resEndLine = -1;
		var resArrayName = ''
		var resBeginLine = -1
		var ret = { BeginLine: -1, EndLine: -1, ArrayName: '' };
		
		strForStream = this.addStringToTheLeft(indexTestCaseDescFunc, "0", 6-(""+indexTestCaseDescFunc).length)

			// ищу Функция ПолучитьСписокТестов(юТестирование) Экспорт ... ВсеТесты = Новый Массив; ... Возврат ВсеТесты; ...
		var reTestCaseDescriptionsFuncBody = new RegExp('FuNm('+strForStream+')LpNm(\\d{6})RpEx.*?(Nm(\\d{6})EqNwNm(\\d{6})).*?ReNm(\\d{6})', "g");
		
		lexemsArray = reTestCaseDescriptionsFuncBody.exec(parser.reStream)
		var findRightBody = lexemsArray && lexemsArray.length >= 6
		if(findRightBody)
	    {
	   			logger.debug(TEST_CASE_DESC_FUNC_NAME + ' (конец) lexemsArray.index ' + lexemsArray.index + ' lexemsArray.lastIndex ' + lexemsArray.lastIndex )
			
			var testCaseArrayName = parser.name(lexemsArray[4]) //ВсеТесты из строки "ВсеТесты = Новый Массив"
			var arrayKeywordName = parser.name(lexemsArray[5]) // Массив из этой же строки
			var returnValueName = parser.name(lexemsArray[6]) // Возврат ВсеТесты
				logger.debug('Наименование массива имен тестовых случаев "' + testCaseArrayName+'"')
				
			findRightBody = /массив/i.test(arrayKeywordName) && testCaseArrayName.toLowerCase() == returnValueName.toLowerCase()
			if (findRightBody) {
				
		        var lex = parser.lexem(parser.posToLexem(lexemsArray.index))
			       	logger.debug('Получили данные по началу функции "'+TEST_CASE_DESC_FUNC_NAME+';" , строка ' + lex.line)
				resBeginLine = lex.line
					
		        var lex = parser.lexem(parser.posToLexem(lexemsArray.lastIndex))
			       	logger.debug('Получили данные по строке "Возврат '+testCaseArrayName+';" , строка ' + lex.line)
					
				ret = { BeginLine: resBeginLine, EndLine: lex.line, ArrayName: testCaseArrayName }
			}
			else {
				logger.error('Должна быть строка "Массив". А получили "' + arrayKeywordName+'"')
				logger.error('Должна быть строка "'+testCaseArrayName+'". А получили "' + returnValueName+'"')
			}
	    }
		else {
			logger.error('Не нашли функцию '+TEST_CASE_DESC_FUNC_NAME+' с необходимой структурой');
			if(lexemsArray)
				logger.error('Количество элементов в массиве разбора лексем (lexemsArray.length) должно быть больше или равно 6, а получили "' + lexemsArray.length+'"')
		}
		return ret;
	},

	getTestCases : function (){
		var parser = this.parser;
		var res = new Array();
	    var reStream = parser.reStream
	    var rePublicProcedureWithoutParams = /(Pc)Nm\d{6}LpRpEx/g
	    var reTestCaseName = /^тест/i

	    while(rePublicProcedureWithoutParams.exec(reStream))
	    {
	        var lex = parser.lexem(parser.posToLexem(RegExp.index + 2))
	       	logger.debug('проверяю процедуру ' + lex.text + ", строка " + lex.line)
	        if (reTestCaseName.exec(lex.text)){
	        	logger.debug('\tнашли тестовый случай ' + lex.text + ", строка " + lex.line)
	        	res.push( lex.text )
	        }
	    }
	 		logger.debug('procNames.length ' + res.length)
	   return res.length ? res : null;
	},

	addStringToTheLeft : function (src, str, count) {
		res = src;
		for(i=0; i < count; i++)
			res = str + res;
		return res;
	}
}); // stdlib.Class.extend
